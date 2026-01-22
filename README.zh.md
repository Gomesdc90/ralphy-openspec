# ralphy-spec

[English](README.md) | [简体中文](README.zh.md) | [한국어](README.ko.md) | [日本語](README.ja.md)

一条命令为以下工具设置 **Ralph 循环 + OpenSpec** 工作流：
- Cursor
- OpenCode
- Claude Code

**官网：** [https://ralphy-spec.org](https://ralphy-spec.org)

## 什么是 Ralphy-Spec？

Ralphy-Spec 结合了两种强大的 AI 开发方法：

### Ralph Wiggum 循环

Ralph 方法论（由 [Geoffrey Huntley](https://ghuntley.com/ralph) 提出）是一种开发方式，AI 代理会**重复接收相同的提示**直到完成任务。每次迭代，AI 都能看到之前在文件和 git 历史中的工作成果，形成自我纠正的反馈循环。

```
while true; do
  ai_agent "构建功能 X。完成后输出 <promise>DONE</promise>。"
  # AI 看到之前的工作，修复错误，继续进展
done
```

### OpenSpec（规范驱动开发）

[OpenSpec](https://github.com/Fission-AI/OpenSpec) 通过在编码前要求规范来为 AI 编码带来结构：
- `openspec/specs/` - 真实来源的规范
- `openspec/changes/` - 带验收标准的变更提案
- 归档工作流将已完成的变更合并回来

### 为什么要结合使用？

| 问题 | 解决方案 |
|------|----------|
| 聊天记录中的需求模糊 | OpenSpec 将意图锁定在结构化规范中 |
| AI 中途停止或出错 | Ralph 循环重试直到完成 |
| 无法验证正确性 | 验收标准 + 测试验证输出 |
| 特定工具的设置很繁琐 | 一条命令设置 Cursor、OpenCode、Claude Code |

## 安装到项目中的内容

- `openspec/` 脚手架：
  - `openspec/specs/`（真实来源）
  - `openspec/changes/`（活跃变更）
  - `openspec/archive/`（已完成的变更）
  - `openspec/project.md`（项目上下文）
- 工具集成：
  - Cursor：`.cursor/prompts/ralphy-*.md`
  - Claude Code：`.claude/commands/ralphy-*.md`
  - OpenCode：`AGENTS.md`
- Ralph 循环状态/配置：
  - `.ralphy/config.json`
  - `.ralphy/ralph-loop.state.json`

## 安装

### npm（全局安装）

```bash
npm install -g ralphy-spec
```

### npx（无需安装）

```bash
npx ralphy-spec init
```

### curl 安装脚本

```bash
curl -fsSL https://raw.githubusercontent.com/anthropics/ralphy-openspec/main/scripts/install.sh | sh
```

## 使用方法

### 在项目中初始化

```bash
cd your-project
ralphy-spec init
```

非交互式工具选择：

```bash
ralphy-spec init --tools cursor,claude-code,opencode
```

覆盖现有文件：

```bash
ralphy-spec init --force
```

### 验证设置

```bash
ralphy-spec validate
```

### 更新模板

```bash
ralphy-spec update --force
```

## 工作流程（PRD -> 交付）

```
PRD/需求 --> OpenSpec（规范 + 任务 + 验收标准）
                    |
                    v
              Ralph 循环（迭代直到测试通过）
                    |
                    v
              归档（合并回源规范）
```

### 1）规划：PRD -> OpenSpec 变更

使用 AI 工具的 `/ralphy:plan`（Cursor / Claude Code），或让 OpenCode 遵循 `AGENTS.md`。

仓库中的预期输出：

```
openspec/changes/<change-name>/
  proposal.md
  tasks.md
  specs/
    <domain>/
      spec.md
```

### 2）实现：迭代直到完成

使用 `/ralphy:implement` 实现任务并添加测试。

如果通过 Ralph 循环运行器运行，代理应该只在**所有任务完成且测试通过**时输出：

```
<promise>TASK_COMPLETE</promise>
```

### 3）验证：测试证明验收标准

使用 `/ralphy:validate` 运行测试并将通过的测试映射回 OpenSpec 场景。

### 4）归档：将变更合并回规范

使用 `/ralphy:archive`，如果可用的话，使用 OpenSpec CLI：

```bash
openspec archive <change-name> --yes
```

## 致谢

Ralphy-Spec 站在巨人的肩膀上：

- **Ralph Wiggum 方法论** - 由 [Geoffrey Huntley](https://ghuntley.com/ralph) 构思。AI 代理可以通过迭代进行自我纠正的洞见改变了我们对 AI 辅助开发的看法。

- **[opencode-ralph-wiggum](https://github.com/Th0rgal/opencode-ralph-wiggum)** by [@Th0rgal](https://github.com/Th0rgal) - 一个简洁的 OpenCode Ralph 循环 CLI 实现，启发了我们的集成方式。

- **[OpenSpec](https://github.com/Fission-AI/OpenSpec)** by [Fission-AI](https://github.com/Fission-AI) - 为 AI 编码带来结构和可预测性的规范驱动开发框架。他们的 `specs/` + `changes/` 模型优雅而实用。

我们感谢这些项目及其维护者开创了这些方法。

## 开发

```bash
npm install
npm run build
node bin/ralphy-spec.js --help
```

## 许可证

BSD-3-Clause
