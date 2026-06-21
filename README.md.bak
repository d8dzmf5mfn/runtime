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
└── packages/cli               # CLI 入口 (Commander.js)
```

## 快速开始

### 前置条件
- Node.js 18+
- Git 2.5+（支持 `git worktree`）
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
| `runtime context sop-init` | 初始化 `.sop-graph/` 规则目录 |
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

# 各自获取优化上下文（只包含相关文件）
runtime context prompt src/api/auth.ts -s <session-id-A>
runtime context prompt src/components/button.tsx -s <session-id-B>
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
        reason: "Always use soft-delete for financial records"
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
# 安装依赖
npm install

# 构建
npm run build

# 测试（27 个测试用例）
npm test

# 监听模式
npm run dev -w packages/vibe-sync
```

### 项目结构
```
packages/
├── shared/          # 共享类型（Session, Worktree, Lock, FileEntry, SOPGraph, ContextRequest）
├── vibe-sync/       # VibeSync 核心
├── context-pruner/  # ContextPruner 核心
└── cli/             # CLI 入口
```

## 技术栈
- **Runtime**: Node.js 22+ / TypeScript 5
- **Storage**: JSON file-based（后续可迁移 SQLite）
- **CLI**: Commander.js + Chalk + Ora
- **Test**: Vitest

## 路线图

- [x] 会话管理 + worktree 隔离
- [x] 文件锁 + 冲突检测
- [x] 文件关联评分引擎
- [x] Token 预算管理
- [x] SOP 策略 DSL
- [x] Prompt 组装
- [x] GitHub Actions CI
- [ ] MCP Server 适配器
- [ ] VS Code 扩展
- [ ] SQLite 持久化
- [ ] 可视化 Dashboard

## 相关项目

在 [Linear](https://linear.app/bananacodex/project/runtime-ai-dev-control-plane-491b8d6e0457) 查看完整的 EPIC/Task 分解。
