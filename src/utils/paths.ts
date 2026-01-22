import path from "node:path";

export function getDistTemplatesDir(): string {
  // Compiled files live in dist/**. This resolves dist/templates.
  return path.resolve(__dirname, "..", "templates");
}

export function resolveProjectDir(dirArg?: string): string {
  return path.resolve(process.cwd(), dirArg ?? ".");
}

