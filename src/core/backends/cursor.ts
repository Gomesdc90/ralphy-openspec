import { execa } from "execa";
import type { BackendEnv, CodingBackend, ImplementInput, ImplementOutput } from "./types";

/**
 * CursorBackend shells out to the `cursor` CLI for code implementation.
 *
 * Note: Cursor IDE typically runs interactively. This backend sends prompts
 * via the CLI and expects the user/AI to complete the task.
 */
export class CursorBackend implements CodingBackend {
  readonly id = "cursor";

  constructor(private readonly opts: { timeoutMs?: number } = {}) {}

  async implement(env: BackendEnv, input: ImplementInput): Promise<ImplementOutput> {
    const { task, iteration, repairNotes } = input;

    // Build the prompt to send to Cursor Agent
    const prompt = this.buildPrompt(task, iteration, repairNotes);

    try {
      /**
       * Cursor 2.x CLI provides `cursor agent` (headless) which is suitable for this backend.
       *
       * Notes:
       * - Requires authentication: `cursor agent login` OR `CURSOR_API_KEY`.
       * - `--print` makes it usable from scripts/non-interactive terminals.
       * - `--workspace` ensures the agent operates on the task working directory.
       */
      const subprocess = execa(
        "cursor",
        ["agent", "--print", "--output-format", "text", "--workspace", env.cwd, prompt],
        {
          cwd: env.cwd,
          timeout: this.opts.timeoutMs ?? 600_000, // 10 min default
          reject: false,
          stdio: "pipe",
        }
      );

      if (env.stream) {
        subprocess.stdout?.pipe(process.stdout);
        subprocess.stderr?.pipe(process.stderr);
      }

      const result = await subprocess;
      const combined = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();

      // Cursor Agent auth failures (common on first run)
      if (result.exitCode !== 0 && /(not logged in|authentication required)/i.test(combined)) {
        return {
          ok: false,
          message:
            "Cursor Agent is not authenticated. Run `cursor agent login` (interactive) or set CURSOR_API_KEY, then retry.",
        };
      }

      if (result.exitCode === 0) {
        return {
          ok: true,
          message: `Cursor Agent completed task "${task.id}" (iteration ${iteration})`,
        };
      }

      // Non-zero exit code
      return {
        ok: false,
        message: `Cursor Agent exited with code ${result.exitCode}: ${combined || "(no output)"}`.slice(
          0,
          2000
        ),
      };
    } catch (err: any) {
      // Handle cases where cursor CLI is not available
      if (err?.code === "ENOENT") {
        return {
          ok: false,
          message:
            "Cursor CLI not found. Install Cursor and enable its shell command so `cursor` is in PATH.",
        };
      }

      return {
        ok: false,
        message: err?.message ? String(err.message).slice(0, 2000) : "Unknown error",
      };
    }
  }

  private buildPrompt(
    task: { id: string; title?: string; goal?: string },
    iteration: number,
    repairNotes?: string
  ): string {
    const lines: string[] = [];

    lines.push(`# Task: ${task.title ?? task.id}`);
    lines.push(``);

    if (task.goal) {
      lines.push(`## Goal`);
      lines.push(task.goal);
      lines.push(``);
    }

    lines.push(`## Where to read context`);
    lines.push(
      [
        `- Read OpenSpec: \`openspec/project.yml\` and any relevant files under \`openspec/specs/**\`.`,
        `- Read task context: \`ralphy-spec/tasks/${task.id}/CONTEXT.md\`.`,
        `- If present, read repair notes: \`ralphy-spec/tasks/${task.id}/REPAIR.md\`.`,
      ].join("\n")
    );
    lines.push(``);

    if (repairNotes) {
      lines.push(`## Repair Notes (iteration ${iteration})`);
      lines.push(repairNotes);
      lines.push(``);
    }

    lines.push(`## Instructions`);
    lines.push(`- Implement the task in this workspace and ensure all configured validators pass.`);
    lines.push(`- Keep changes within the task file contract / scope guard constraints.`);

    return lines.join("\n");
  }
}
