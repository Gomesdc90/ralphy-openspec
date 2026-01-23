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

    // Build the prompt to send to Cursor
    const prompt = this.buildPrompt(task, iteration, repairNotes);

    try {
      // Cursor CLI: `cursor --command "prompt"` or similar
      // Note: Cursor's CLI interface may vary; adjust as needed
      const result = await execa("cursor", ["--command", prompt], {
        cwd: env.cwd,
        timeout: this.opts.timeoutMs ?? 600_000, // 10 min default
        reject: false,
        stdio: "pipe",
      });

      if (result.exitCode === 0) {
        return {
          ok: true,
          message: `Cursor completed task "${task.id}" (iteration ${iteration})`,
        };
      }

      // Non-zero exit code
      return {
        ok: false,
        message: `Cursor exited with code ${result.exitCode}: ${result.stderr || result.stdout}`.slice(
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
            "Cursor CLI not found. Please ensure Cursor is installed and the CLI is in PATH.",
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

    if (repairNotes) {
      lines.push(`## Repair Notes (iteration ${iteration})`);
      lines.push(repairNotes);
      lines.push(``);
    }

    lines.push(`Please implement this task and ensure all validators pass.`);

    return lines.join("\n");
  }
}
