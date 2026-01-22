import fs from "node:fs/promises";
import path from "node:path";

async function copyDir(srcDir, dstDir) {
  await fs.mkdir(dstDir, { recursive: true });
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const dstPath = path.join(dstDir, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, dstPath);
    } else if (entry.isFile()) {
      await fs.mkdir(path.dirname(dstPath), { recursive: true });
      await fs.copyFile(srcPath, dstPath);
    }
  }
}

const scriptsDir = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(scriptsDir, "..");
const srcTemplates = path.join(root, "src", "templates");
const dstTemplates = path.join(root, "dist", "templates");

try {
  await fs.access(srcTemplates);
  await copyDir(srcTemplates, dstTemplates);
} catch {
  // No templates yet; ignore.
}

