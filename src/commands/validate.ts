import type { Command } from "commander";
import type { ToolId } from "../types";
import { detectExistingTools } from "../utils/detector";
import { resolveProjectDir } from "../utils/paths";
import { validateProject } from "../utils/validator";

function parseToolsArg(arg?: string): ToolId[] | undefined {
  if (!arg) return undefined;
  const parts = arg
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const allowed: ToolId[] = ["cursor", "claude-code", "opencode"];
  const tools: ToolId[] = [];
  for (const p of parts) {
    if ((allowed as string[]).includes(p)) tools.push(p as ToolId);
  }
  return tools.length ? tools : undefined;
}

export function registerValidateCommand(program: Command): void {
  program
    .command("validate")
    .description("Validate that Ralph-OpenSpec setup is complete")
    .option("--dir <path>", "Target project directory (default: current directory)")
    .option(
      "--tools <list>",
      "Comma-separated list: cursor,claude-code,opencode (default: detect)"
    )
    .action(async (opts: { dir?: string; tools?: string }) => {
      const dir = resolveProjectDir(opts.dir);
      const tools = parseToolsArg(opts.tools) ?? (await detectExistingTools(dir));
      const issues = await validateProject(dir, tools);

      if (!issues.length) {
        process.stdout.write("OK: Ralph-OpenSpec setup looks good.\n");
        return;
      }

      for (const issue of issues) {
        const prefix = issue.level === "error" ? "ERROR" : "WARN";
        process.stdout.write(
          `${prefix}: ${issue.message}${issue.path ? ` (${issue.path})` : ""}\n`
        );
      }

      const hasErrors = issues.some((i) => i.level === "error");
      process.exitCode = hasErrors ? 1 : 0;
    });
}

