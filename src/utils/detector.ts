import fs from "node:fs/promises";
import path from "node:path";
import type { ToolId } from "../types";

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function detectExistingTools(projectDir: string): Promise<ToolId[]> {
  const found = new Set<ToolId>();

  if (await exists(path.join(projectDir, ".cursor"))) found.add("cursor");
  if (await exists(path.join(projectDir, ".claude"))) found.add("claude-code");
  if (await exists(path.join(projectDir, "AGENTS.md"))) found.add("opencode");

  return [...found];
}

