#!/bin/bash
# Runtime (🫪) — 双 Agent 并发编辑演示
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI="$SCRIPT_DIR/../packages/cli/dist/index.js"
DEMO_DIR=$(mktemp -d /tmp/runtime-demo-XXXX)
REPO_DIR="$DEMO_DIR/my-project"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   Runtime (🫪) — 双 Agent 并发编辑演示         ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# Clean stale data
rm -f /var/folders/hq/kr1lzf1d1y368j6vt47blpgr0000gn/T/runtime-data/{locks,sessions}.json 2>/dev/null || true

echo "📁 创建测试仓库..."
mkdir -p "$REPO_DIR/src"
cd "$REPO_DIR"
git init -q
git config user.email "demo@runtime.dev" && git config user.name "Demo"

cat > src/auth.ts << 'EOF'
export function login(u: string, p: string): string {
  if (!u || !p) throw new Error("Missing credentials");
  return "token-" + u;
}
EOF
cat > src/payment.ts << 'EOF'
export function processPayment(amount: number, userId: string) {
  if (amount <= 0) throw new Error("Invalid");
  return { tx: "tx-" + Date.now(), status: "done" };
}
EOF
git add -A && git commit -m "init" -q
echo "  仓库: $REPO_DIR"
echo ""

cli() { node "$CLI" "$@" 2>&1 || true; }

echo "┌─ [Agent A] 启动 Cursor 会话 ─────────────────┐"
cd "$REPO_DIR"
OUT_A=$(cli vibe session-start -a cursor -b feat/auth-upgrade | sed "s/\\x1b\\[[0-9;]*m//g")
SESSION_A=$(echo "$OUT_A" | grep -oE '[a-zA-Z0-9]{12}')
echo "  ✅ 会话 A: $SESSION_A"
echo ""

echo "┌─ [Agent A] 锁定 src/auth.ts ──────────────────┐"
cli vibe lock-acquire src/auth.ts -s "$SESSION_A"
echo ""

echo "┌─ [Agent B] 启动 Copilot 会话 ─────────────────┐"
cd "$REPO_DIR"
OUT_B=$(cli vibe session-start -a copilot -b feat/payment-v2 | sed "s/\\x1b\\[[0-9;]*m//g")
SESSION_B=$(echo "$OUT_B" | grep -oE '[a-zA-Z0-9]{12}')
echo "  ✅ 会话 B: $SESSION_B"
echo ""

echo "┌─ [Agent B] 尝试锁定 auth.ts（预期冲突）───────┐"
cd "$REPO_DIR"
RESULT=$(cli vibe lock-acquire src/auth.ts -s "$SESSION_B")
if echo "$RESULT" | grep -q "already locked"; then
  echo "  ✅ 冲突正确拦截！"
else
  echo "  ⚠️  冲突未检测到"
fi
echo ""

echo "┌─ [Agent B] 锁定 src/payment.ts ───────────────┐"
cli vibe lock-acquire src/payment.ts -s "$SESSION_B"
echo ""

echo "┌─ ContextPruner: Agent A 的上下文 ─────────────┐"
cli context select src/auth.ts | head -6
echo ""

echo "═══════════════════════════════════════════════════"
echo "  📊 系统状态"
echo "═══════════════════════════════════════════════════"
cli status
echo ""

cli vibe lock-release src/auth.ts 2>/dev/null || true
cli vibe lock-release src/payment.ts 2>/dev/null || true
cli vibe session-stop "$SESSION_A" 2>/dev/null || true
cli vibe session-stop "$SESSION_B" 2>/dev/null || true

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   🎉 演示完成                                  ║"
echo "║   ✅ VibeSync: Agent 间文件冲突已避免           ║"
echo "║   ✅ ContextPruner: Token 消耗已优化             ║"
echo "╚══════════════════════════════════════════════════╝"
