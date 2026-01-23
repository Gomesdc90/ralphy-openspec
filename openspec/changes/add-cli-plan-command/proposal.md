# Proposal: Add `ralphy-spec plan` (CLI-driven planning)

## Summary
Add a new CLI command, `ralphy-spec plan`, that converts user requirements (string prompt or PRD file) plus optional reference documents into:

- An OpenSpec change folder under `openspec/changes/<changeId>/` (`proposal.md`, `tasks.md`, and `specs/**` deltas)
- A machine-executable task plan written into `openspec/project.yml` (tasks, budgets, validators, file contracts, acceptance)
- Artifacts indicating that PLAN is complete (`ralphy-spec/STATUS.md` and `ralphy-spec/runs/<runId>.md`)

This mirrors what the IDE commands (`/ralphy-plan`) already do, but makes it runnable from a plain terminal so users are not forced into Cursor/Claude Code to bootstrap specs.

## Motivation
- Lower friction: users can run `init → plan → run` entirely from CLI.
- Consistency: reuse the existing backend adapter layer (cursor/opencode/claude-code/noop) and artifact system.
- Better task execution: planning can enforce sprint sizing, three-tier budgets, file contracts, and validator mapping so `run` has bounded context and smaller tasks.

## Scope
- Add `ralphy-spec plan <input|file>` supporting:
  - `ralphy-spec plan "I want to build a website for my xxx"`
  - `ralphy-spec plan prd.md`
  - `ralphy-spec plan "..." --ref reference.md --ref docs/notes.md`
  - `ralphy-spec plan prd.md --ref docs/*.md`
- Implement required flags:
  - `--dir <path>`: repo root (consistent with `init`/`validate`)
  - `--backend <cursor|opencode|claude-code|noop>`: default matches `run` behavior (project default)
  - `--artifact-dir <dir>`: consistent with `run` artifacts override
  - `--ref <file>` (repeatable): reference inputs; globs expanded
  - `--change <slug>`: optional explicit change name, else derived
  - `--json`: structured output (like `run/status/budget/report`)
- Planning “mode” constraints:
  - Planner MUST only write OpenSpec files and artifacts (no product code changes)
  - Planner MUST produce tasks that include sprint sizing, three-tier budgets, file contracts, validators, and per-task “DONE means …” acceptance
- After generation, automatically run validation (at minimum: OpenSpec scaffold sanity + project.yml schema load) and fail fast on invalid output.

## Non-goals
- Implementing the planned tasks (that remains `ralphy-spec run`).
- Changing the on-disk schema beyond what `openspec/project.yml` already supports.
- Rewriting or migrating existing archived specs into `openspec/specs/`.
- Adding an interactive PRD editor or UI.
- Auto-splitting “XL tasks” (may be added later as a follow-up improvement).

## Assumptions
- Users run `ralphy-spec init` first; `plan` may validate and refuse to proceed if required scaffold/prompt templates are missing.
- The planner backend is invoked as a one-shot command (or a bounded loop), and writes files in the repo.
- `openspec/specs/` may be empty; the planner must still be able to create a coherent change folder and tasks.

## Risks / Mitigations
- **Backend CLI variability (especially Cursor)**: keep adapter behavior minimal, provide clear errors if CLI is not installed, support `noop` for testing.
- **Overwriting user content**: default behavior should be additive and refuse to overwrite existing `openspec/changes/<changeId>` unless the folder is empty or explicitly requested (future `--force`).
- **Change slug collisions**: derive a stable kebab-case slug with a short suffix when needed.
- **Prompt injection via refs**: treat reference docs as untrusted input; planning prompt must clearly constrain allowed outputs.

## Success Criteria
- Users can run `ralphy-spec init`, then `ralphy-spec plan ...`, then `ralphy-spec run` without opening an IDE.
- `plan` produces deterministic, schema-valid `openspec/project.yml` tasks including:
  - sprint sizing + intent (optional but preferred)
  - three-tier budgets
  - file contracts / scope guard hints
  - validators mapping
  - explicit acceptance per task
- `plan` writes artifacts marking PLAN completion, and emits JSON when `--json` is supplied.

# Change Proposal: v0.4.0 — Add `ralphy-spec plan` (CLI-driven OpenSpec planning)

**Type:** Feature / Workflow enhancement  
**Depends on:** `ralphy-spec v2.1` (budgets, sprint semantics, artifacts)  

## Summary

Add a new CLI command:

- `ralphy-spec plan <input>` (string prompt or PRD file)

So users can bootstrap OpenSpec changes and tasks from the terminal without needing Cursor/Claude Code interactive commands.

This command generates the same planning artifacts promised by `/ralphy-plan`, but does so via the existing backend adapter layer and artifact system.

## Motivation

### Problem

- Today, “Plan” is effectively tied to IDE-specific flows (Cursor prompts / Claude Code commands), which creates friction for:
  - CLI-first users
  - headless automation
  - quick “PRD → OpenSpec change folder” bootstrapping

### Goal

- Make “Plan” a first-class CLI stage, aligning with the existing workflow: **Plan → Implement → Validate → Archive**.

## Goals

- Provide `ralphy-spec plan` as a CLI command that can:
  - Accept prompt text or a PRD file
  - Include optional reference files (`--ref`, repeatable; supports globs)
  - Select backend (`--backend`) using the same backend ids as `run`
  - Generate deterministic OpenSpec change artifacts under `openspec/changes/<changeId>/`
  - Update `openspec/project.md` and `openspec/project.yml` to make `run` immediately usable
  - Write artifacts showing **PLAN completed** (STATUS + run log)
  - Run a post-plan validation step (schema + minimal structural checks)

- Enforce planning output quality so `run` is bounded and predictable:
  - Every generated task has `sprint.size` and `sprint.intent`
  - Every generated task has three-tier `budget` (or sprint defaults apply deterministically)
  - Every generated task has `files_contract` hints to guard scope
  - Every generated task has `validators` mapped (typecheck/test/lint or user-defined)
  - Every generated task has explicit `acceptance` criteria (“DONE means …”)

## Non-Goals

- Implementing product code in this change (planning MUST NOT modify non-OpenSpec product code).
- Multi-agent orchestration / parallel task execution (future work).
- Remote backends or hosted planning service.
- New OpenSpec schemas outside what the repo already supports, unless explicitly required by this change’s spec deltas.

## Approach (No New Infrastructure)

- Reuse the existing prompt templates installed by `init`:
  - `.cursor/prompts/ralphy-plan.md`
  - `.claude/commands/ralphy-plan.md`
  - `AGENTS.md` (OpenCode)

- Assemble a **Planning Context Pack** from:
  - The user prompt or PRD file contents
  - The reference file contents (`--ref`)
  - Repo context (`openspec/project.md`, and any existing `openspec/specs/**` if present)
  - A strict “PLAN MODE” constraint: *only write OpenSpec files; do not implement product code*

- Invoke the chosen backend via the existing backend adapter layer (same as `run`).

- After writing outputs, run a post-plan validation step:
  - Load `openspec/project.yml` via `SpecLoader` (schema validation)
  - Ensure expected change folder and required files exist

- Write artifacts:
  - `ralphy-spec/STATUS.md` with phase “PLAN completed”
  - `ralphy-spec/runs/<runId>.md` describing input + output + validation results

## Risks

- **Overwriting existing tasks**: updating `openspec/project.yml` must be deterministic and safe (see spec for collision handling).
- **Backend variability**: different tools may produce different output styles; the CLI must enforce structural requirements (tasks/budgets/validators).
- **Context bloat**: reference globs could select too many files; the plan context pack must be bounded.

## Success Criteria

- Running `ralphy-spec plan "..."` creates a new `openspec/changes/<changeId>/` folder with `proposal.md`, `tasks.md`, and `specs/**`.
- `openspec/project.yml` becomes runnable immediately with `ralphy-spec run --dry-run`.
- `ralphy-spec/STATUS.md` indicates PLAN completed and points to the generated change.
- A deterministic post-plan validation step passes (schema + required files).

