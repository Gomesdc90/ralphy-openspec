import { execa } from "execa";

export type MergeStrategy = "squash" | "merge" | "rebase";

export type MergeOptions = {
  repoRoot: string;
  sourceBranch: string;
  targetBranch?: string;
  strategy: MergeStrategy;
  message?: string;
};

export type MergeResult = {
  ok: boolean;
  commitRef?: string;
  error?: string;
};

/**
 * Merge a source branch into the current (or target) branch.
 *
 * Strategies:
 * - squash: Combines all commits into one (cleanest history)
 * - merge: Standard merge commit
 * - rebase: Rebase source onto target
 */
export async function mergeBranch(opts: MergeOptions): Promise<MergeResult> {
  const { repoRoot, sourceBranch, targetBranch, strategy, message } = opts;

  try {
    // If target branch specified, checkout to it first
    if (targetBranch) {
      await git(["checkout", targetBranch], repoRoot);
    }

    switch (strategy) {
      case "squash": {
        await git(["merge", "--squash", sourceBranch], repoRoot);

        const commitMsg = message ?? `Squash merge ${sourceBranch}`;
        await git(["commit", "-m", commitMsg], repoRoot);
        break;
      }

      case "merge": {
        const commitMsg = message ?? `Merge branch '${sourceBranch}'`;
        await git(["merge", sourceBranch, "-m", commitMsg], repoRoot);
        break;
      }

      case "rebase": {
        await git(["rebase", sourceBranch], repoRoot);
        break;
      }
    }

    const commitRef = await git(["rev-parse", "HEAD"], repoRoot);

    return { ok: true, commitRef };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message ?? String(err),
    };
  }
}

/**
 * Apply a patch file to the current working directory.
 */
export async function applyPatch(opts: {
  repoRoot: string;
  patchContent: string;
}): Promise<MergeResult> {
  try {
    const res = await execa("git", ["apply", "--3way", "-"], {
      cwd: opts.repoRoot,
      input: opts.patchContent,
      stdio: ["pipe", "pipe", "pipe"],
      reject: false,
    });

    if (res.exitCode !== 0) {
      return { ok: false, error: res.stderr || "Patch apply failed" };
    }

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

/**
 * Generate a patch from changes between two refs.
 */
export async function generatePatch(opts: {
  repoRoot: string;
  fromRef: string;
  toRef?: string;
}): Promise<string> {
  const { repoRoot, fromRef, toRef } = opts;

  const args = toRef ? ["diff", fromRef, toRef] : ["diff", fromRef];

  const res = await execa("git", args, {
    cwd: repoRoot,
    stdio: "pipe",
  });

  return res.stdout;
}

async function git(args: string[], cwd: string): Promise<string> {
  const res = await execa("git", args, {
    cwd,
    stdio: "pipe",
    reject: false,
  });

  if (res.exitCode !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${res.stderr || res.stdout}`);
  }

  return res.stdout.trim();
}
