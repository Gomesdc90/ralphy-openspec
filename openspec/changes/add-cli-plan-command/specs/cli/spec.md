# Spec: `ralphy-spec plan` Command

## Domain
CLI / Commands

## ADDED Requirements

### Requirement: Plan Command Exists
The CLI MUST provide a `ralphy-spec plan` command that converts requirements into an OpenSpec change + executable task plan.

#### Scenario: Plan from inline prompt
- GIVEN `ralphy-spec init` has completed successfully
- WHEN `ralphy-spec plan "I want to build a website for my xxx"` is executed
- THEN it MUST treat the argument as the planning input
- AND it MUST produce a change folder under `openspec/changes/<changeId>/`
- AND it MUST update `openspec/project.yml` with planned tasks
- AND it MUST write artifacts indicating PLAN completion

#### Scenario: Plan from PRD file
- GIVEN a file `prd.md` exists
- WHEN `ralphy-spec plan prd.md` is executed
- THEN it MUST read `prd.md` as the planning input
- AND it MUST behave identically to inline prompt planning

### Requirement: Plan Flags (Minimum)
The `plan` command MUST support the following flags:
- `--dir <path>`: target repo root
- `--backend <cursor|opencode|claude-code|noop>`: backend id (default: matches `run`)
- `--artifact-dir <dir>`: override artifact root directory
- `--ref <file>` (repeatable): reference inputs; globs expanded
- `--change <slug>`: explicit change id
- `--json`: structured output

#### Scenario: `--dir` selects repo root
- GIVEN `--dir /path/to/repo`
- WHEN `ralphy-spec plan ... --dir /path/to/repo` is executed
- THEN the plan MUST read and write files relative to `/path/to/repo`

#### Scenario: `--backend` overrides default
- GIVEN `openspec/project.yml` default backend is `cursor`
- WHEN `ralphy-spec plan ... --backend noop` is executed
- THEN the plan MUST invoke the `noop` backend for the planning call

### Requirement: Reference Inputs (`--ref`) Support Globs
The `plan` command MUST accept `--ref` repeatedly and MUST expand globs deterministically.

#### Scenario: Repeated refs
- GIVEN `--ref reference.md --ref docs/notes.md`
- WHEN plan runs
- THEN both files MUST be included in the planning context pack

#### Scenario: Glob refs
- GIVEN `--ref docs/*.md` matches N files
- WHEN plan runs
- THEN all N matched files MUST be included in the planning context pack
- AND the inclusion order MUST be stable (lexicographic by resolved path)

#### Scenario: Missing ref is an error
- GIVEN `--ref does-not-exist.md`
- WHEN plan runs
- THEN the command MUST fail with exit code `4`
- AND it MUST report which ref(s) failed to resolve

### Requirement: Change Id Derivation
When `--change` is not provided, the command MUST derive a kebab-case `<changeId>` from the planning input.

#### Scenario: Derived change id is stable
- GIVEN the same planning input and refs
- WHEN `--change` is omitted
- THEN the derived `<changeId>` MUST be stable across runs

#### Scenario: Collision handling
- GIVEN the derived `<changeId>` already exists and is non-empty
- WHEN plan runs without `--change`
- THEN the command MUST avoid clobbering by choosing a different id (e.g. suffix)

### Requirement: PLAN Artifacts
On success, the command MUST write artifacts indicating that planning completed.

#### Scenario: STATUS.md indicates PLAN completion
- GIVEN plan completes successfully
- WHEN `ralphy-spec/STATUS.md` is read
- THEN it MUST include `phase: PLAN`
- AND it MUST include a human-readable message indicating “PLAN completed”
- AND it MUST include the corresponding `runId`

#### Scenario: Run log exists
- GIVEN plan completes successfully
- WHEN the artifact folder is inspected
- THEN `ralphy-spec/runs/<runId>.md` MUST exist
- AND it MUST be immutable (not overwritten if already present)

### Requirement: JSON Output
When `--json` is provided, the command MUST output machine-readable JSON to stdout.

#### Scenario: JSON includes key results
- GIVEN `ralphy-spec plan ... --json`
- WHEN plan completes successfully
- THEN stdout MUST be JSON with at least:
  - `ok: true`
  - `runId: string`
  - `changeId: string`
  - `filesWritten: string[]`
  - `taskCount: number`

### Requirement: Exit Codes
The `plan` command MUST use deterministic exit codes.

#### Scenario: Success
- GIVEN planning succeeds
- WHEN the command exits
- THEN the exit code MUST be `0`

#### Scenario: Spec/project invalid
- GIVEN planning results in invalid OpenSpec scaffold or invalid project.yml schema
- WHEN validation runs after planning
- THEN the exit code MUST be `4`

#### Scenario: Backend invocation error
- GIVEN the backend cannot be invoked (e.g. binary missing)
- WHEN plan runs
- THEN the exit code MUST be `5`

## MODIFIED Requirements

### Requirement: CLI Workflow Includes Plan
The documented workflow MUST support `init → plan → run` as a first-class CLI flow.

#### Scenario: CLI help includes plan
- GIVEN `ralphy-spec --help`
- WHEN executed
- THEN it MUST list the `plan` command and its flags

# Spec Delta: `ralphy-spec plan` command

## Domain
CLI / Commands

## ADDED Requirements

### Requirement: Plan Command (CLI entrypoint)
The CLI MUST provide a `plan` command that generates OpenSpec planning artifacts from a prompt or PRD file.

#### Scenario: Plan from prompt text
- GIVEN a repo with `openspec/` scaffold
- WHEN `ralphy-spec plan "I want to build a website for my xxx"`
- THEN it MUST generate a new change folder under `openspec/changes/<changeId>/`
- AND it MUST update `openspec/project.yml` so that `ralphy-spec run --dry-run` succeeds
- AND it MUST write `ralphy-spec/STATUS.md` indicating PLAN completed

#### Scenario: Plan from PRD file path
- GIVEN a file `prd.md` exists
- WHEN `ralphy-spec plan prd.md`
- THEN it MUST treat the input as a file path (not a literal prompt string)
- AND it MUST include `prd.md` contents in the planning context

### Requirement: Plan Flags (minimum)
The `plan` command MUST support the following flags:

- `--dir <path>`: repo root (default: current working directory)
- `--backend <cursor|opencode|claude-code|noop>`: planning backend (default: same resolution behavior as `run`)
- `--artifact-dir <dir>`: override artifact root directory (enables artifacts)
- `--ref <fileOrGlob>` (repeatable): reference file inputs
- `--change <slug>`: explicit change id (kebab-case)
- `--json`: structured output

#### Scenario: Plan uses repo root
- GIVEN `--dir /tmp/myrepo` is passed
- WHEN `ralphy-spec plan "..." --dir /tmp/myrepo`
- THEN it MUST read and write all repo-relative paths under `/tmp/myrepo`

#### Scenario: Plan backend defaults match run
- GIVEN `openspec/project.yml` sets `defaults.backend: "cursor"`
- WHEN `ralphy-spec plan "..."` is executed without `--backend`
- THEN it MUST choose `"cursor"` as backend

### Requirement: Reference inputs
The `plan` command MUST accept reference inputs via `--ref` and include them in the planning context pack.

#### Scenario: `--ref` is repeatable
- GIVEN `--ref reference.md --ref docs/notes.md`
- WHEN `plan` is executed
- THEN both files MUST be included in the context pack in deterministic order

#### Scenario: `--ref` supports globs
- GIVEN `--ref docs/*.md`
- WHEN `plan` is executed
- THEN it MUST expand the glob relative to repo root
- AND include all matched files (deduplicated, stable-sorted)

#### Scenario: Glob matches zero files
- GIVEN `--ref docs/does-not-exist-*.md`
- WHEN `plan` is executed
- THEN it MUST fail deterministically with a non-zero exit code
- AND in `--json` mode it MUST include an error message indicating “no ref files matched”

### Requirement: Outputs (files)
The `plan` command MUST create/update the following outputs:

- `openspec/project.md` (project context; updated with planning input summary)
- `openspec/project.yml` (authoritative plan file containing tasks/validators/budgets)
- `openspec/changes/<changeId>/proposal.md`
- `openspec/changes/<changeId>/tasks.md`
- `openspec/changes/<changeId>/specs/**/spec.md` (at least one spec delta file)
- `ralphy-spec/STATUS.md` (indicating PLAN completed)
- `ralphy-spec/runs/<runId>.md` (plan log)

#### Scenario: Minimum change folder contents
- GIVEN `ralphy-spec plan "..."` succeeds
- THEN `openspec/changes/<changeId>/proposal.md` MUST exist
- AND `openspec/changes/<changeId>/tasks.md` MUST exist
- AND at least one file MUST exist under `openspec/changes/<changeId>/specs/`

### Requirement: Change id derivation
If `--change` is not provided, the `plan` command MUST derive a `changeId` from the input deterministically.

#### Scenario: Explicit change id
- GIVEN `--change add-profile-filters`
- WHEN `plan` runs
- THEN it MUST use `openspec/changes/add-profile-filters/` as output folder

#### Scenario: Derived change id
- GIVEN no `--change` flag is provided
- WHEN `plan` runs
- THEN it MUST derive a kebab-case id
- AND it MUST NOT exceed a reasonable maximum length (implementation-defined)

### Requirement: JSON output
When `--json` is provided, the command MUST output machine-readable JSON.

#### Scenario: JSON shape on success
- GIVEN `ralphy-spec plan "..." --json` succeeds
- THEN stdout MUST be valid JSON
- AND include fields: `ok`, `changeId`, `runId`, `writtenFiles`, `validation`, `warnings`

#### Scenario: JSON shape on failure
- GIVEN `ralphy-spec plan "..." --json` fails
- THEN stdout MUST be valid JSON
- AND include fields: `ok=false`, `exitCode`, and `error`

### Requirement: Post-plan validation
After generating artifacts, the `plan` command MUST validate the resulting OpenSpec plan deterministically.

#### Scenario: Schema validation
- GIVEN `plan` has written `openspec/project.yml`
- WHEN post-plan validation runs
- THEN it MUST load the spec via `SpecLoader.loadProjectSpec()`
- AND fail with a deterministic error if the schema is invalid

### Requirement: Exit codes
The `plan` command MUST use deterministic exit codes:

- `0`: success
- `4`: invalid inputs or invalid/insufficient planned outputs (structural/schema failures)
- `5`: backend invocation error
- `6`: filesystem / IO error writing outputs

#### Scenario: Invalid PRD file path
- GIVEN `ralphy-spec plan does-not-exist.md`
- WHEN executed
- THEN it MUST exit with code `4`

## Acceptance Criteria

- [ ] `ralphy-spec plan <prompt|file>` exists and is documented in CLI help
- [ ] Generated outputs match the required file set
- [ ] `--ref` globs work and are deterministic
- [ ] `--json` mode outputs stable JSON on success and failure
- [ ] Post-plan validation prevents unusable `project.yml`

