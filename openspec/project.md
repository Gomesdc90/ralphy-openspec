# Project Context: ralphy-spec

ralphy-spec is a CLI tool that combines OpenSpec (spec-driven development) with Ralph Loop (iterative AI execution) for predictable AI-assisted coding across Cursor, OpenCode, and Claude Code.

## Stack
- Language: TypeScript
- Runtime: Node.js >= 20.19.0
- Package manager: npm
- Build: tsc (TypeScript compiler)
- Database: better-sqlite3 (persistence)
- Schema validation: zod

## Architecture (v2)
- CLI framework: commander
- Self-correcting execution engine with budget tracking
- Supports: Cursor, Claude Code, OpenCode
- Workflow phases: PLAN → PREP → EXEC → VALIDATE → DIAGNOSE → REPAIR → CHECKPOINT → DONE
- Workspace modes: patch (default), worktree

## Core Components
- **Engine** (`src/core/engine/`) - Loop state machine, repair logic, context packing
- **Spec Loader** (`src/core/spec/`) - Zod schemas, DAG builder, file contracts
- **Backends** (`src/core/backends/`) - Cursor, OpenCode, ClaudeCode adapters
- **Validators** (`src/core/validators/`) - Runner + parsers (tsc, eslint, jest)
- **Budgets** (`src/core/budgets/`) - Tier tracking, degrade mode
- **Memory** (`src/core/memory/`) - SQLite persistence, ledger logging
- **Workspace** (`src/core/workspace/`) - Patch mode, worktree mode

## CLI Commands
- `ralphy-spec init` - Initialize project with openspec/project.yml
- `ralphy-spec run` - Execute tasks with AI backend
- `ralphy-spec status` - Show current run state
- `ralphy-spec report` - Generate markdown report
- `ralphy-spec tail` - Stream ledger events
- `ralphy-spec checkpoint` - Manual checkpoint creation

## Conventions
- Code style: TypeScript strict mode
- Testing: (to be added)
- CI: GitHub Actions (deploy-docs.yml)
- File structure: src/cli/, src/core/, src/utils/, src/templates/

## Key Directories
- `src/cli/` - CLI command implementations
- `src/core/` - Core engine, spec, backends, validators, budgets, memory, workspace
- `src/utils/` - Shared utilities (detector, installer, paths, validator)
- `src/templates/` - AI tool prompt templates
- `docs/` - Astro-based documentation site

## External References
- [Ralph Wiggum methodology](https://ghuntley.com/ralph)
- [opencode-ralph-wiggum](https://github.com/Th0rgal/opencode-ralph-wiggum)
- [OpenSpec](https://github.com/Fission-AI/openspec)
