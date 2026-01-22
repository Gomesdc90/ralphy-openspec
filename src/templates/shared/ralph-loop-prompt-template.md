# Ralph Loop Prompt Template (OpenSpec task runner)

Use this template when running an AI agent in a loop (Ralph methodology). The same prompt may be repeated until the completion promise is printed.

## Context
You are implementing OpenSpec change: `{{change_name}}`

## Current Task
{{current_task_from_tasks_md}}

## Acceptance Criteria
{{acceptance_criteria}}

## Instructions
1. Read the spec at `openspec/changes/{{change_name}}/` and the baseline specs in `openspec/specs/`.
2. Implement the current task.
3. Run tests to verify the acceptance criteria.
4. If tests pass, mark the task complete and output `<promise>TASK_COMPLETE</promise>`.
5. If tests fail, fix issues and continue iterating.

## Important
- Do NOT output the promise until tests pass.
- Prefer small, incremental changes.
- Keep tests aligned with OpenSpec scenarios.

