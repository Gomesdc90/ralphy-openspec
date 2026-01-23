# Change Tasks: add-cli-plan-command

## 1. Planning / Scaffolding
- [ ] 1.1 Confirm existing on-disk schemas and directories used by runtime
  - Acceptance criteria:
    - GIVEN current repo state
    - WHEN `ralphy-spec init` has been run
    - THEN `openspec/specs/`, `openspec/changes/`, and `openspec/project.yml` exist
    - AND `SpecLoader.loadProjectSpec()` succeeds on a minimal project.yml
  - Test plan:
    - Run: `npm run typecheck`
    - Assert: no TypeScript errors

## 2. CLI: `ralphy-spec plan`
- [ ] 2.1 Add `plan` command entrypoint and flag parsing
  - Implementation notes:
    - New file: `src/cli/plan.ts`
    - Register in `src/index.ts`
    - Support inputs: inline prompt string OR file path
    - Implement required flags: `--dir`, `--backend`, `--artifact-dir`, `--ref` (repeatable), `--change`, `--json`
  - Acceptance criteria:
    - GIVEN `ralphy-spec plan "hello"`
    - WHEN executed
    - THEN it accepts the input as a prompt string
    - AND exits with code 0 on success
    - GIVEN `ralphy-spec plan prd.md`
    - WHEN `prd.md` exists
    - THEN it reads file contents as the planning input
  - Test plan:
    - Run: `npm test`
    - Assert: unit tests cover argument parsing and input resolution

- [ ] 2.2 Implement reference ingestion (`--ref`) with glob expansion
  - Implementation notes:
    - Use `fast-glob` (already a dependency)
    - Allow `--ref` to be repeated
    - Preserve stable ordering in context pack (lexicographic after expansion)
  - Acceptance criteria:
    - GIVEN `--ref docs/*.md`
    - WHEN it matches N files
    - THEN all N files are included in the planning context
    - AND missing refs cause a clear error (exit code 4)
  - Test plan:
    - Run: `npm test`
    - Assert: deterministic file ordering and error behavior

- [ ] 2.3 Derive `changeId` when `--change` is not provided
  - Implementation notes:
    - Produce kebab-case slug
    - Apply max length
    - Add short suffix if needed to avoid collisions
  - Acceptance criteria:
    - GIVEN input text changes
    - WHEN `--change` is omitted
    - THEN derived `changeId` is stable for identical inputs
    - AND does not clobber an existing non-empty change folder
  - Test plan:
    - Run: `npm test`

- [ ] 2.4 JSON output mode
  - Acceptance criteria:
    - GIVEN `ralphy-spec plan ... --json`
    - WHEN the plan completes successfully
    - THEN stdout is valid JSON describing: `ok`, `runId`, `changeId`, `filesWritten`, `taskCount`
  - Test plan:
    - Run: `npm test`

## 3. Planning execution (reuse backend adapter layer)
- [ ] 3.1 Build a Planning Context Pack (PLAN MODE)
  - Implementation notes:
    - Include: user input, expanded ref contents, repo metadata (from existing detector if available), and hard constraints:
      - "PLAN MODE: only write OpenSpec files and artifacts; do not implement product code"
      - "Tasks must be sprint-sized and budgeted"
    - Prefer reading planning template from installed tool prompts:
      - Cursor: `.cursor/prompts/ralphy-plan.md`
      - Claude Code: `.claude/commands/ralphy-plan.md`
      - OpenCode: `AGENTS.md` (plus a short plan-mode header)
  - Acceptance criteria:
    - GIVEN a repo with the planning template installed
    - WHEN plan runs
    - THEN the backend receives the template + context pack + constraints
  - Test plan:
    - Run: `npm test`
    - Assert: context pack contains required sections and excludes execution-only noise

- [ ] 3.2 Invoke backend for planning and enforce “OpenSpec-only” output
  - Implementation notes:
    - Use existing backend process invocation (no new infrastructure required)
    - Enforce a scope guard: detect and fail if non-OpenSpec paths are modified (policy: block)
  - Acceptance criteria:
    - GIVEN backend attempts to modify `src/**`
    - WHEN plan finishes
    - THEN plan MUST fail and report a scope violation
  - Test plan:
    - Run: `npm test`
    - Assert: scope violations are detected deterministically

## 4. Outputs / Artifacts
- [ ] 4.1 Write OpenSpec change folder and update project files
  - Implementation notes:
    - Create or update:
      - `openspec/project.yml` (tasks + validators mapping)
      - `openspec/project.md` (only create if missing; do not overwrite)
      - `openspec/changes/<changeId>/proposal.md`
      - `openspec/changes/<changeId>/tasks.md`
      - `openspec/changes/<changeId>/specs/**` (spec deltas)
  - Acceptance criteria:
    - GIVEN successful plan run
    - WHEN files are inspected
    - THEN the above files exist
    - AND `SpecLoader.loadProjectSpec()` succeeds
  - Test plan:
    - Run: `npm test`

- [ ] 4.2 Write PLAN completion artifacts (`STATUS.md` and run log)
  - Implementation notes:
    - Use `writeStatus(...)` with `phase: "PLAN"` and a clear “PLAN completed” message
    - Use `writeRunLogOnce(...)` to create `ralphy-spec/runs/<runId>.md`
  - Acceptance criteria:
    - GIVEN successful plan run
    - WHEN artifacts are inspected
    - THEN `ralphy-spec/STATUS.md` shows `phase: PLAN`
    - AND run log exists for the same `runId`
  - Test plan:
    - Run: `npm test`

## 5. Validation (post-plan)
- [ ] 5.1 Run schema-level validation after planning
  - Implementation notes:
    - At minimum: run the same checks as `ralphy-spec validate` (scaffold) plus `SpecLoader.loadProjectSpec()`
  - Acceptance criteria:
    - GIVEN the planner writes invalid YAML or invalid task schema
    - WHEN plan completes
    - THEN plan MUST exit non-zero and report validation errors
  - Test plan:
    - Run: `npm test`

## 6. Release hygiene
- [ ] 6.1 Update CLI docs + bump version to v0.4.0 (if releasing)
  - Test plan:
    - Run: `npm run typecheck`
    - Run: `npm test`

# Tasks: v0.4.0 — Add `ralphy-spec plan`

**Change:** `add-cli-plan-command`  

---

## 1) CLI surface + parsing

- [ ] **1.1** Add `ralphy-spec plan` command entrypoint
  - Implementation notes:
    - Create `src/cli/plan.ts` and register it in the CLI program (same pattern as `run`, `init`, `validate`).
    - Support command forms:
      - `ralphy-spec plan "..."` (treat as prompt text)
      - `ralphy-spec plan prd.md` (treat as file path if exists)
  - Flags:
    - `--dir <path>` repo root (default: cwd)
    - `--backend <cursor|opencode|claude-code|noop>` (default: same as `run`)
    - `--artifact-dir <dir>` (override artifact root; enables artifacts)
    - `--ref <fileOrGlob>` (repeatable; resolve relative to repo root)
    - `--change <slug>` explicit change id/slug
    - `--json` machine-readable output
  - Test plan:
    - `npm run typecheck`
    - Unit tests for input disambiguation (string vs existing file path)

## 2) Reference resolution + bounded context inputs

- [ ] **2.1** Implement `--ref` resolution (repeatable; globs supported)
  - Implementation notes:
    - Resolve patterns relative to repo root.
    - Deduplicate paths, stable-sort for determinism.
    - Hard cap total ref files and/or total bytes to keep planning bounded.
    - If a glob matches zero files, treat as error (deterministic).
  - Test plan:
    - Add unit tests for:
      - glob expansion
      - dedup + sort
      - “no matches” error

- [ ] **2.2** Build a Planning Context Pack (text) for backend invocation
  - Implementation notes:
    - Include:
      - user input (prompt or PRD content)
      - ref file contents (bounded)
      - `openspec/project.md`
      - any existing `openspec/specs/**` summaries (if present)
      - strict PLAN MODE constraints (OpenSpec-only writes; no product code)
    - Keep format deterministic and stable to reduce backend variance.
  - Test plan:
    - Unit test snapshot for generated context pack (deterministic output)

## 3) Backend invocation (reuse adapter layer)

- [ ] **3.1** Invoke selected backend to execute planning prompt once
  - Implementation notes:
    - Reuse the same backend ids and adapter selection logic as `run`.
    - Reuse the installed prompt templates (Cursor/Claude/OpenCode) as the core instruction text.
    - Ensure “PLAN MODE” constraint is included in the payload sent to the backend.
  - Test plan:
    - `--backend noop` path test: plan runs without external tool dependency and produces deterministic failure/success behavior.

## 4) File outputs + structural enforcement

- [ ] **4.1** Enforce plan output structure and quality gates
  - Implementation notes:
    - Ensure outputs exist:
      - `openspec/changes/<changeId>/proposal.md`
      - `openspec/changes/<changeId>/tasks.md`
      - `openspec/changes/<changeId>/specs/**/spec.md` (at least one)
    - Ensure generated tasks in `openspec/project.yml` include:
      - `sprint.size` and `sprint.intent`
      - `budget` (or sprint defaults applied deterministically by loader)
      - `validators` (mapped to declared validators)
      - `files_contract.allowed` (non-empty) + `forbidden` (may be empty)
      - `acceptance` (non-empty; “DONE means …”)
    - If task ids collide with existing `openspec/project.yml` tasks, fail deterministically.
  - Test plan:
    - Unit tests for:
      - change id derivation + slug normalization
      - collision detection

- [ ] **4.2** Update `openspec/project.md` and `openspec/project.yml`
  - Implementation notes:
    - `project.md`: append/update a “Planned on …” section containing input summary + ref list.
    - `project.yml`: inject/merge planned tasks so `ralphy-spec run --dry-run` works immediately.
  - Test plan:
    - `node dist/index.js run --dry-run --json` (after build) produces a valid plan list

## 5) Post-plan validation + artifacts

- [ ] **5.1** Post-plan validation (schema + minimal checks)
  - Implementation notes:
    - Validate scaffold:
      - `openspec/` folders exist
      - `openspec/project.md` present
    - Validate spec:
      - `SpecLoader.loadProjectSpec()` succeeds
      - `buildTaskDAG()` succeeds unless tasks are empty
  - Test plan:
    - Unit test: invalid YAML causes deterministic non-zero exit + JSON error payload

- [ ] **5.2** Write PLAN artifacts
  - Implementation notes:
    - Write `ralphy-spec/STATUS.md` with phase “PLAN completed”, plus change id and output file pointers.
    - Write `ralphy-spec/runs/<runId>.md` with:
      - input summary
      - refs included
      - change id
      - validation results
  - Test plan:
    - Unit tests for artifact path resolution with `--artifact-dir`

## 6) JSON output + exit codes

- [ ] **6.1** Implement `--json` output contract for `plan`
  - Implementation notes:
    - Output MUST include: `ok`, `changeId`, `runId`, `writtenFiles`, `validation`, `warnings`.
  - Test plan:
    - Unit test for JSON schema shape (keys present, stable types)

---

## Validation checklist (manual)

- [ ] `npm test`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `node dist/index.js plan "I want to build a website" --backend noop --json` writes expected files and artifacts

