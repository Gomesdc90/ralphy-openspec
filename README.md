# ralphy-spec

[English](README.md) | [简体中文](README.zh.md) | [한국어](README.ko.md) | [日本語](README.ja.md)

One-command setup for **Ralph loop + OpenSpec** workflows across:
- Cursor
- OpenCode
- Claude Code

**Website:** [https://ralphy-spec.org](https://ralphy-spec.org)

## What is Ralphy-Spec?

Ralphy-Spec combines two powerful AI development methodologies:

### The Ralph Wiggum Loop

The Ralph methodology (coined by [Geoffrey Huntley](https://ghuntley.com/ralph)) is a development approach where an AI agent receives the **same prompt repeatedly** until it completes a task. Each iteration, the AI sees its previous work in files and git history, creating a self-correction feedback loop.

```
while true; do
  ai_agent "Build feature X. Output <promise>DONE</promise> when complete."
  # AI sees previous work, fixes mistakes, continues progress
done
```

### OpenSpec (Spec-Driven Development)

[OpenSpec](https://github.com/Fission-AI/OpenSpec) brings structure to AI coding by requiring specs before code:
- `openspec/specs/` - Source of truth specifications
- `openspec/changes/` - Proposed changes with acceptance criteria
- Archive workflow to merge completed changes back

### Why Combine Them?

| Problem | Solution |
|---------|----------|
| Vague requirements in chat history | OpenSpec locks intent in structured specs |
| AI stops mid-task or makes mistakes | Ralph loop retries until completion |
| No way to verify correctness | Acceptance criteria + tests validate output |
| Tool-specific setup is tedious | One command sets up Cursor, OpenCode, Claude Code |

## What it installs into your project

- `openspec/` scaffold:
  - `openspec/specs/` (source of truth)
  - `openspec/changes/` (active changes)
  - `openspec/archive/` (completed changes)
  - `openspec/project.md` (project context)
- Tool integrations:
  - Cursor: `.cursor/prompts/ralphy-*.md`
  - Claude Code: `.claude/commands/ralphy-*.md`
  - OpenCode: `AGENTS.md`
- Ralph loop state/config:
  - `.ralphy/config.json`
  - `.ralphy/ralph-loop.state.json`

## Installation

### npm (global)

```bash
npm install -g ralphy-spec
```

### npx (no install)

```bash
npx ralphy-spec init
```

### curl install script

```bash
curl -fsSL https://raw.githubusercontent.com/anthropics/ralphy-openspec/main/scripts/install.sh | sh
```

## Usage

### Initialize in a project

```bash
cd your-project
ralphy-spec init
```

Non-interactive tool selection:

```bash
ralphy-spec init --tools cursor,claude-code,opencode
```

Overwrite existing files:

```bash
ralphy-spec init --force
```

### Validate setup

```bash
ralphy-spec validate
```

### Update templates

```bash
ralphy-spec update --force
```

## Workflow (PRD -> Ship)

```
PRD/Requirements --> OpenSpec (specs + tasks + acceptance criteria)
                          |
                          v
                    Ralph Loop (iterate until tests pass)
                          |
                          v
                    Archive (merge back to source specs)
```

### 1) Plan: PRD -> OpenSpec change

Use your AI tool with `/ralphy:plan` (Cursor / Claude Code), or ask OpenCode to follow `AGENTS.md`.

Expected output in your repo:

```
openspec/changes/<change-name>/
  proposal.md
  tasks.md
  specs/
    <domain>/
      spec.md
```

### 2) Implement: iterate until done

Use `/ralphy:implement` to implement tasks and add tests.

If you run this via a Ralph loop runner, the agent should only output:

```
<promise>TASK_COMPLETE</promise>
```

when **all tasks are done and tests pass**.

### 3) Validate: tests prove acceptance criteria

Use `/ralphy:validate` to run tests and map passing tests back to OpenSpec scenarios.

### 4) Archive: merge change back into specs

Use `/ralphy:archive` and (if available) the OpenSpec CLI:

```bash
openspec archive <change-name> --yes
```

## Credits and Appreciation

Ralphy-Spec stands on the shoulders of giants:

- **Ralph Wiggum Methodology** - Conceived by [Geoffrey Huntley](https://ghuntley.com/ralph). The insight that AI agents can self-correct through iteration changed how we think about AI-assisted development.

- **[opencode-ralph-wiggum](https://github.com/Th0rgal/opencode-ralph-wiggum)** by [@Th0rgal](https://github.com/Th0rgal) - A clean CLI implementation of the Ralph loop for OpenCode that inspired our integration approach.

- **[OpenSpec](https://github.com/Fission-AI/OpenSpec)** by [Fission-AI](https://github.com/Fission-AI) - The spec-driven development framework that brings structure and predictability to AI coding. Their `specs/` + `changes/` model is elegant and practical.

We are grateful to these projects and their maintainers for pioneering these approaches.

## Development

```bash
npm install
npm run build
node bin/ralphy-spec.js --help
```

## License

BSD-3-Clause
