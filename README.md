# Runtime — AI Dev Control Plane 🫪

> **VibeSync + ContextPruner**: 多 AI Agent 协同开发的网关 & 上下文编译器

![CI](https://github.com/d8dzmf5mfn/runtime/actions/workflows/ci.yml/badge.svg)
[![Linear](https://img.shields.io/badge/Linear-Project-blue)](https://linear.app/bananacodex/project/runtime-ai-dev-control-plane-491b8d6e0457)

---

## 痛点

多个 AI Agent（Cursor、Copilot、Codex 等）同时操作同一个仓库时：
- 🔥 **文件冲突** — Agent A 改的文件被 Agent B 覆盖
- 🧠 **上下文溢出** — 每次都给 AI 喂整个项目，Token 爆炸
- 🔄 **状态丢失** — Agent 会话断开后不知道做到哪了

**Runtime 就是来解决这些问题的。**

## 架构

```
Runtime
├── packages/shared            # 共享类型定义
├── packages/vibe-sync         # VibeSync — 并发 AI 开发网关
│   ├── session/               #   会话生命周期管理
│   ├── worktree/              #   git worktree 隔离
│   ├── lock/                  #   文件租约锁
│   └── git-proxy/             #   git 命令代理
├── packages/context-pruner    # ContextPruner — JIT 上下文编译
│   ├── selector/              #   文件相关性评分引擎
│   ├── token-budget/          #   Token 预算管理
│   ├── sop-graph/             #   SOP 决策图 DSL
│   └── prompt-builder/        #   Prompt 组装器
├── packages/cli               # CLI 入口 (Commander.js)
└── packages/mcp-server        # MCP Server — 供 AI 工具直接调用
```

## 快速开始

### 前置条件
- Node.js 18+
- Git 2.5+
- npm

### 安装

```bash
git clone https://github.com/d8dzmf5mfn/runtime.git
cd runtime
npm install
npm run build
```

### 一键启动

```bash
bash bootstrap.sh
```

或者手动：

```bash
node packages/cli/dist/index.js --help
```

## 安装

### 方式一：克隆仓库（完整版）

```bash
git clone https://github.com/d8dzmf5mfn/runtime.git
cd runtime
npm install
npm run build
```

### 方式二：用 Claude Code 安装插件（推荐）

```bash
# 在项目目录下运行
claude mcp add --transport stdio runtime --scope project -- \
  node /path/to/runtime/packages/mcp-server/dist/index.js
```

> **前提**：需要先 `git clone` 并 `npm install && npm run build`。

### 方式三：仅使用 MCP 配置（轻量）

如果只是想用 MCP 工具，不需要 CLI，复制项目中的 `.mcp.json` 到你的项目根目录即可。

---

## MCP 集成

Runtime 通过 **Model Context Protocol (MCP)** 将核心能力暴露给 AI 客户端（Codex、Claude Code、Cursor 等），让 AI 工具直接调用 Runtime 的服务。

### 配置

#### Codex（当前项目已配好）

编辑 `.codex/mcp.json`：

```json
{
  "servers": {
    "runtime": {
      "command": "node",
      "args": ["${CLAUDE_PROJECT_DIR:-.}/packages/mcp-server/dist/index.js"]
    }
  }
}
```

#### Claude Code（`.mcp.json` 已随项目提供）

```json
{
  "mcpServers": {
    "runtime": {
      "command": "node",
      "args": ["${CLAUDE_PROJECT_DIR}/packages/mcp-server/dist/index.js"],
      "env": {}
    }
  }
}
```

或用 CLI 命令添加：

```bash
claude mcp add --transport stdio runtime --scope project -- \
  node packages/mcp-server/dist/index.js
```


### MCP 工具一览

| 工具 | 功能 | 类别 |
|------|------|------|
| `vibe_lock_acquire` | 获取文件独占锁 | 文件锁 |
| `vibe_lock_release` | 释放文件锁 | 文件锁 |
| `vibe_lock_list` | 查看所有活跃锁 | 文件锁 |
| `context_select` | 分析关联文件 & 排名 | 上下文 |
| `context_build_prompt` | 生成优化 prompt + 规则 | 上下文 |
| `context_estimate_tokens` | 估算 Token 消耗 | 上下文 |
| `sop_match` | 匹配 SOP 编码策略 | 策略 |

### Skill（Codex 使用指南）

项目自带 [`runtime-mcp` skill](.codex/skills/SKILL.md)，安装后 Codex 会自动学会何时调用各工具：

```
.codex/skills/
├── SKILL.md                       ← 工具使用指南
├── agents/openai.yaml             ← UI 元数据
├── scripts/init-runtime.sh        ← 初始化脚本
└── references/sop-dsl.md          ← SOP DSL 语法参考
```

## CLI 命令

### VibeSync — 会话 & 工作区管理
| 命令 | 说明 |
|------|------|
| `runtime vibe session-start -a <agent> -b <branch>` | 启动新 AI 会话，自动创建 worktree |
| `runtime vibe session-list` | 列出所有活跃会话 |
| `runtime vibe session-stop <id>` | 停止并合并会话 |

### VibeSync — 文件锁
| 命令 | 说明 |
|------|------|
| `runtime vibe lock-acquire <file> -s <session>` | 获取文件独占锁 |
| `runtime vibe lock-release <file>` | 释放文件锁 |
| `runtime vibe lock-list` | 查看所有文件锁 |

### ContextPruner — 上下文优化
| 命令 | 说明 |
|------|------|
| `runtime context select <file>` | 分析关联文件 & 排名 |
| `runtime context budget <files...>` | 估算 Token 消耗 |
| `runtime context sop-init` | 初始化 `.sop-graph/` |
| `runtime context sop-add <domain>` | 添加策略域 |
| `runtime context sop-list` | 列出策略域 |
| `runtime context prompt <file>` | 生成优化 prompt |

### 系统状态
| 命令 | 说明 |
|------|------|
| `runtime status` | 系统全景：会话 + 锁 + SOP 域 |

## 演示场景

```bash
# 启动两个 Agent 会话
runtime vibe session-start -a cursor -b feat/payment
runtime vibe session-start -a copilot -b feat/ui

# Agent A 锁定核心文件
runtime vibe lock-acquire src/api/auth.ts -s <session-id-A>

# Agent B 尝试锁定同一文件 — 冲突检测！
runtime vibe lock-acquire src/api/auth.ts -s <session-id-B>
# → Error: File is locked by session <session-id-A>

# 各自获取优化上下文
runtime context prompt src/api/auth.ts -s <session-id-A>
runtime context prompt src/components/button.tsx -s <session-id-B>
```

### 安装

### 方式一：克隆仓库（完整版）

```bash
git clone https://github.com/d8dzmf5mfn/runtime.git
cd runtime
npm install
npm run build
```

### 方式二：用 Claude Code 安装插件（推荐）

```bash
# 在项目目录下运行
claude mcp add --transport stdio runtime --scope project -- \
  node /path/to/runtime/packages/mcp-server/dist/index.js
```

> **前提**：需要先 `git clone` 并 `npm install && npm run build`。

### 方式三：仅使用 MCP 配置（轻量）

如果只是想用 MCP 工具，不需要 CLI，复制项目中的 `.mcp.json` 到你的项目根目录即可。

---

## MCP 集成演示（Codex 中直接调用）

```
# 编辑前锁定文件
→ vibe_lock_acquire(src/api/auth.ts, session-1)

# 获取相关文件上下文
→ context_select(src/api/auth.ts)

# 检查适用编码策略
→ sop_match(src/api/auth.ts)

# 编辑完成后释放锁
→ vibe_lock_release(src/api/auth.ts)
```

## SOP DSL 示例

```yaml
# .sop-graph/rules.yaml
version: "1.0"
domains:
  - domain: payment
    rules:
      - action: forbid
        target: "hard-delete"
        reason: "Always use soft-delete"
      - action: require
        target: "stripe-idempotency"
        reason: "Prevent duplicate charges"
  - domain: api
    rules:
      - action: enforce
        target: "input-validation"
        pattern: "zod|joi|yup"
        reason: "All API inputs must be validated"
```

## 开发

```bash
npm install
npm run build
npm test          # 36 个测试用例
```

### 项目结构
```
packages/
├── shared/          # 共享类型
├── vibe-sync/       # VibeSync 核心
├── context-pruner/  # ContextPruner 核心
├── cli/             # CLI 入口
└── mcp-server/      # MCP Server（7 个工具）
```

## 技术栈
- **Runtime**: Node.js 22+ / TypeScript 5
- **Storage**: JSON file-based
- **CLI**: Commander.js + Chalk + Ora
- **MCP**: @modelcontextprotocol/sdk
- **Test**: Vitest

## 路线图

- [x] 会话管理 + worktree 隔离
- [x] 文件锁 + 冲突检测
- [x] 文件关联评分引擎
- [x] Token 预算管理
- [x] SOP 策略 DSL
- [x] Prompt 组装
- [x] GitHub Actions CI
- [x] MCP Server + Codex 插件
- [x] Codex Skill（使用指南）
- [x] Claude Code 适配 (.mcp.json)
- [ ] VS Code 扩展
- [ ] SQLite 持久化
- [ ] 可视化 Dashboard

## 相关项目

在 [Linear](https://linear.app/bananacodex/project/runtime-ai-dev-control-plane-491b8d6e0457) 查看完整的 EPIC/Task 分解。
