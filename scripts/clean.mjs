import fs from "node:fs/promises";
import path from "node:path";

async function rmIfExists(p) {
  try {
    await fs.rm(p, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

const root = path.resolve(new URL(".", import.meta.url).pathname, "..", "..");
await rmIfExists(path.join(root, "dist"));

