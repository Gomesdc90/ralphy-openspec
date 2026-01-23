import { execa } from "execa";
import type { BackendEnv, CodingBackend, ImplementInput, ImplementOutput } from "./types";

/**
 * OpenCodeBackend shells out to the `opencode` CLI for code implementation.
 *
 * OpenCode is an open-source AI coding assistant that can run in headless mode.
 */
export class OpenCodeBackend implements CodingBackend {
  readonly id = "opencode";

  constructor(private readonly opts: { timeoutMs?: number } = {}) {}

  async implement(env: BackendEnv, input: ImplementInput): Promise<ImplementOutput> {
    const { task, iteration, repairNotes } = input;

    // Build the prompt to send to OpenCode
    const prompt = this.buildPrompt(task, iteration, repairNotes);

    try {
      // OpenCode CLI: `opencode run --prompt "..." --non-interactive`
      const subprocess = execa(
        "opencode",
        ["run", "--prompt", prompt, "--non-interactive"],
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

      if (result.exitCode === 0) {
        return {
          ok: true,
          message: `OpenCode completed task "${task.id}" (iteration ${iteration})`,
        };
      }

      // Non-zero exit code
      return {
        ok: false,
        message: `OpenCode exited with code ${result.exitCode}: ${result.stderr || result.stdout}`.slice(
          0,
          2000
        ),
      };
    } catch (err: any) {
      // Handle cases where opencode CLI is not available
      if (err?.code === "ENOENT") {
        return {
          ok: false,
          message:
            "OpenCode CLI not found. Please ensure OpenCode is installed and in PATH.",
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
