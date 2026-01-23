import { execa } from "execa";
import type { BackendEnv, CodingBackend, ImplementInput, ImplementOutput } from "./types";

/**
 * ClaudeCodeBackend shells out to the `claude` CLI for code implementation.
 *
 * Claude Code (Anthropic's coding assistant) supports headless operation
 * via the claude CLI with --print or --output-format json flags.
 */
export class ClaudeCodeBackend implements CodingBackend {
  readonly id = "claude-code";

  constructor(private readonly opts: { timeoutMs?: number } = {}) {}

  async implement(env: BackendEnv, input: ImplementInput): Promise<ImplementOutput> {
    const { task, iteration, repairNotes } = input;

    // Build the prompt to send to Claude Code
    const prompt = this.buildPrompt(task, iteration, repairNotes);

    try {
      // Claude CLI: `claude --print "prompt"` for headless operation
      // The --print flag runs claude non-interactively
      const result = await execa("claude", ["--print", prompt], {
        cwd: env.cwd,
        timeout: this.opts.timeoutMs ?? 600_000, // 10 min default
        reject: false,
        stdio: "pipe",
      });

      if (result.exitCode === 0) {
        return {
          ok: true,
          message: `Claude Code completed task "${task.id}" (iteration ${iteration})`,
        };
      }

      // Non-zero exit code
      return {
        ok: false,
        message: `Claude Code exited with code ${result.exitCode}: ${result.stderr || result.stdout}`.slice(
          0,
          2000
        ),
      };
    } catch (err: any) {
      // Handle cases where claude CLI is not available
      if (err?.code === "ENOENT") {
        return {
          ok: false,
          message:
            "Claude CLI not found. Please ensure Claude Code is installed and the CLI is in PATH.",
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
