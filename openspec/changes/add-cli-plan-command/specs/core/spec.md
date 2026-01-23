# Spec: Planning Mode (Context Pack + Output Quality)

## Domain
Core / Planning

## ADDED Requirements

### Requirement: Planning Context Pack
The system MUST be able to construct a Planning Context Pack for `ralphy-spec plan`.

#### Scenario: Context pack includes required inputs
- GIVEN a planning input (inline prompt or PRD file) and zero or more `--ref` files
- WHEN the planning context pack is constructed
- THEN it MUST include:
  - the raw planning input text
  - the contents of each reference file
  - basic repo metadata available to the CLI (e.g. language/package manager detection, if available)
  - explicit constraints: “PLAN MODE: only write OpenSpec files and artifacts; do not implement product code”

### Requirement: Planning Prompt Reuses Installed Templates
The `plan` command MUST reuse the planning prompt templates installed by `ralphy-spec init` when available.

#### Scenario: Cursor template preferred for cursor backend
- GIVEN backend is `cursor`
- AND `.cursor/prompts/ralphy-plan.md` exists
- WHEN `ralphy-spec plan` runs
- THEN it MUST use that template as the primary planning instruction payload

#### Scenario: Claude Code template preferred for claude-code backend
- GIVEN backend is `claude-code`
- AND `.claude/commands/ralphy-plan.md` exists
- WHEN `ralphy-spec plan` runs
- THEN it MUST use that template as the primary planning instruction payload

#### Scenario: Fallback template
- GIVEN no backend-specific planning template exists
- WHEN `ralphy-spec plan` runs
- THEN it MUST fall back to a built-in minimal planning template that still enforces PLAN MODE constraints

### Requirement: OpenSpec-Only Writes (Scope Guard)
Planning MUST be constrained to OpenSpec and artifact outputs.

#### Scenario: Allowed writes
- GIVEN plan runs
- WHEN files are written
- THEN writes MUST be limited to:
  - `openspec/project.yml`
  - `openspec/project.md` (create-if-missing only)
  - `openspec/changes/<changeId>/**`
  - `ralphy-spec/**` (artifacts)

#### Scenario: Disallowed writes are blocked
- GIVEN the backend attempts to write outside the allowed paths (e.g. `src/**`, `package.json`)
- WHEN plan completes
- THEN the command MUST fail
- AND it MUST report a scope violation

### Requirement: Planner Output Quality Constraints
The planner MUST generate tasks that improve execution predictability.

#### Scenario: Per-task sizing + budgets
- GIVEN plan creates or updates `openspec/project.yml` tasks
- WHEN tasks are inspected
- THEN each task MUST include either:
  - `sprint.size` and `sprint.intent`, OR
  - an explicit three-tier `budget` with `hard.max_iterations`

#### Scenario: Per-task file contracts
- GIVEN plan creates tasks
- WHEN tasks are inspected
- THEN each task MUST include a `files_contract` that narrows allowed edits (scope guard hints)

#### Scenario: Validators mapped to tasks
- GIVEN plan creates tasks
- WHEN tasks are inspected
- THEN each task MUST list `validators`
- AND each validator id MUST exist in `openspec/project.yml` `validators`

#### Scenario: Done means explicit acceptance
- GIVEN plan creates tasks
- WHEN tasks are inspected
- THEN each task MUST include explicit acceptance criteria (e.g. `acceptance` entries in project.yml and/or change tasks.md)

### Requirement: Post-Plan Validation
After planning, the CLI MUST validate the generated OpenSpec outputs before reporting success.

#### Scenario: Invalid YAML fails fast
- GIVEN the planner writes invalid YAML to `openspec/project.yml`
- WHEN plan finishes and validation runs
- THEN plan MUST fail with exit code `4`
- AND it MUST report a schema/parse error

#### Scenario: Valid project spec loads
- GIVEN the planner writes a valid `openspec/project.yml`
- WHEN validation runs
- THEN `SpecLoader.loadProjectSpec()` MUST succeed

## ADDED Requirements (Execution Invariant)

### Requirement: Task-Siloed Backend Invocation
The system SHOULD treat each task execution as an isolated backend invocation to bound context windows.

#### Scenario: Fresh invocation per task
- GIVEN `ralphy-spec run` executes tasks A then B
- WHEN the backend is invoked for task B
- THEN it SHOULD be invoked as a fresh process call
- AND it SHOULD not carry over prior task conversation state except via artifacts/spec files

# Spec Delta: Planning context + plan quality gates

## Domain
Core / Planning + Execution Contracts

## ADDED Requirements

### Requirement: Planning Mode (OpenSpec-only writes)
When running `ralphy-spec plan`, the system MUST operate in a strict “PLAN MODE”.

#### Scenario: Plan mode forbids product code changes
- GIVEN `ralphy-spec plan ...` is executing
- WHEN the backend is invoked
- THEN the instruction payload MUST explicitly forbid changes outside OpenSpec and artifact files
- AND the system MUST treat edits outside allowed paths as a plan failure

### Requirement: Planning Context Pack (deterministic and bounded)
The system MUST build a deterministic, bounded context pack for planning.

The planning context pack MUST include:
- User input (prompt text or PRD file content)
- Reference file contents from `--ref` (bounded)
- `openspec/project.md` (existing project context)
- Existing source-of-truth specs under `openspec/specs/**` if present
- Planning constraints (“PLAN MODE” rules, output requirements)

#### Scenario: Planning context is deterministic
- GIVEN the same repo state and the same inputs
- WHEN `plan` is run twice
- THEN the planning context pack text MUST be identical

#### Scenario: Planning context is bounded
- GIVEN a large number of reference files via `--ref`
- WHEN the planning context pack is built
- THEN the system MUST apply deterministic limits (count and/or bytes)
- AND it MUST record truncation/omissions in the plan run log

### Requirement: Planned tasks MUST be runnable (quality gates)
The planner output MUST produce tasks that are runnable by `ralphy-spec run` without manual edits.

For each planned task written to `openspec/project.yml`, the system MUST ensure:
- `id` is present and unique within the project
- `title` and `goal` are present
- `sprint.size` is present (XS/S/M/L/XL)
- `sprint.intent` is present (fix/feature/refactor/infra)
- Either:
  - `budget.optimal`, `budget.warning`, `budget.hard` are present, OR
  - sprint defaults apply deterministically (as implemented by spec loader)
- `validators` is present (non-empty) and references declared validators
- `files_contract.allowed` is present (non-empty)
- `acceptance` is present (non-empty), and each acceptance item describes what “DONE” means

#### Scenario: Missing task sizing causes failure
- GIVEN planned tasks missing `sprint.size` or `sprint.intent`
- WHEN `plan` performs structural enforcement
- THEN it MUST fail deterministically with exit code `4`
- AND report which tasks violate requirements

#### Scenario: Validator mapping is consistent
- GIVEN a planned task references `validators: ["typecheck", "test"]`
- WHEN the plan is finalized
- THEN the project spec MUST include validator definitions with ids `typecheck` and `test`

#### Scenario: File contracts are present for scope guarding
- GIVEN a planned task is written to `openspec/project.yml`
- THEN it MUST include a `files_contract` section
- AND `files_contract.allowed` MUST be non-empty

### Requirement: Task-siloed execution invariant (context window control)
The system SHOULD provide a task-siloed execution invariant for `run`:

For each task execution:
- A fresh backend invocation MUST be used (no implicit carry-over chat/session state)
- A fresh context pack MUST be built from current artifacts/specs at the time of invocation
- Previous task transcripts MUST NOT be included unless explicitly referenced via artifacts

#### Scenario: Fresh context pack per task
- GIVEN task A completes and task B begins
- WHEN the backend is invoked for task B
- THEN the context pack MUST be generated from current `openspec/` + `ralphy-spec/` artifacts
- AND MUST NOT include task A conversation transcript by default

## Acceptance Criteria

- [ ] Planning context pack is deterministic and bounded
- [ ] Plan mode forbids product code edits
- [ ] Planned tasks include sprint semantics, budgets (or defaults), validators, file contracts, and acceptance criteria
- [ ] Task-siloed execution invariant is documented as a product guarantee (and enforced where feasible)

