import fs from "node:fs/promises";
import path from "node:path";
import type { ToolId, ValidationIssue } from "../types";

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function validateProject(
  projectDir: string,
  tools: ToolId[]
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  const openspecDir = path.join(projectDir, "openspec");
  if (!(await exists(openspecDir))) {
    issues.push({
      level: "error",
      message: "Missing openspec directory. Run `ralphy-openspec init`.",
      path: "openspec/",
    });
    return issues;
  }

  for (const p of ["openspec/specs", "openspec/changes", "openspec/project.md"]) {
    if (!(await exists(path.join(projectDir, p)))) {
      issues.push({ level: "error", message: `Missing ${p}`, path: p });
    }
  }

  if (tools.includes("cursor")) {
    const p = ".cursor/prompts/ralphy-plan.md";
    if (!(await exists(path.join(projectDir, p)))) {
      issues.push({ level: "warning", message: `Missing ${p}`, path: p });
    }
  }

  if (tools.includes("claude-code")) {
    const p = ".claude/commands/ralphy-plan.md";
    if (!(await exists(path.join(projectDir, p)))) {
      issues.push({ level: "warning", message: `Missing ${p}`, path: p });
    }
  }

  if (tools.includes("opencode")) {
    const p = "AGENTS.md";
    if (!(await exists(path.join(projectDir, p)))) {
      issues.push({ level: "warning", message: `Missing ${p}`, path: p });
    }
  }

  return issues;
}

