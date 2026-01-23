# OpenSpec Tasks Template

Use this structure for `openspec/changes/<change-name>/tasks.md`.

## 1. Planning / Scaffolding
- [ ] 1.1 Confirm scope, non-goals, and impacted modules
  - Acceptance criteria:
    - GIVEN the current `openspec/specs/` baseline
    - WHEN this change is implemented
    - THEN only the intended domains are affected
  - Test plan: N/A

## 2. Implementation
- [ ] 2.1 Implement feature behavior (spec-driven)
  - Acceptance criteria:
    - GIVEN ...
    - WHEN ...
    - THEN ...
  - Test plan:
    - Run: `npm test`
    - Assert: ...

## 3. Validators / Budgets (v2+)
- [ ] 3.1 Define or update validators used by this change
  - Notes:
    - Validators are the ground truth (deterministic pass/fail)
    - Prefer: `npm run typecheck`, `npm test`, `npm run lint`
  - Test plan:
    - Run the validator commands locally/CI

- [ ] 3.2 If the change introduces budgeted execution (v2.1+), document expected behavior
  - Notes:
    - Optimal → Warning → Hard tier expectations
    - WARNING tier should shrink context + enforce repair-only constraints
    - HARD tier should stop safely (no silent retries)
  - Test plan:
    - Run a small demo task that crosses WARNING tier and confirm behaviors

## 3. Validation
- [ ] 3.1 Add/adjust tests to cover all scenarios
  - Test plan:
    - Run: `npm test`

## 4. Documentation / Archive
- [ ] 4.1 Update OpenSpec docs/spec deltas (if needed) and archive change
  - Test plan:
    - Run: `npm test`

