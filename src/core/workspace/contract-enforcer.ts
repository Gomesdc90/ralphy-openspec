import { execa } from "execa";
import type { FileContract } from "../spec/types";
import { evaluateFileContract, type ContractViolation } from "../spec/file-contract";
import type { Issue } from "../validators/types";

export type EnforcementResult = {
  violations: ContractViolation[];
  revertedFiles: string[];
  issues: Issue[];
};

/**
 * ContractEnforcer handles automatic reversion of files that violate contracts.
 *
 * Unlike WorkspaceManager.enforceContract which reverts ALL changes on violation,
 * this enforcer can selectively revert only the violating files.
 */
export class ContractEnforcer {
  constructor(private readonly repoRoot: string) {}

  /**
   * Check changed files against a contract and auto-revert violations.
   *
   * @param changedFiles - List of changed files with isNew flag
   * @param contract - The file contract to enforce
   * @param autoRevert - If true, automatically revert violating files
   * @returns Enforcement result with violations, reverted files, and issues
   */
  async enforce(args: {
    changedFiles: Array<{ file: string; isNew: boolean }>;
    contract: FileContract;
    autoRevert?: boolean;
  }): Promise<EnforcementResult> {
    const { changedFiles, contract, autoRevert = true } = args;

    const violations = evaluateFileContract({ changedFiles, contract });

    if (violations.length === 0) {
      return { violations: [], revertedFiles: [], issues: [] };
    }

    const revertedFiles: string[] = [];
    const issues: Issue[] = [];

    if (autoRevert) {
      for (const v of violations) {
        try {
          await this.revertFile(v.file, changedFiles.find((f) => f.file === v.file)?.isNew ?? false);
          revertedFiles.push(v.file);
        } catch (err: any) {
          // If revert fails, create an issue instead
          issues.push({
            kind: "contract_violation",
            level: "error",
            message: `Failed to auto-revert ${v.file}: ${err?.message ?? String(err)}`,
            file: v.file,
            raw: { violation: v, error: err?.message },
          });
        }
      }
    }

    // Create issues for all violations
    for (const v of violations) {
      const wasReverted = revertedFiles.includes(v.file);
      issues.push({
        kind: "contract_violation",
        level: wasReverted ? "warning" : "error",
        message: wasReverted
          ? `File contract violation (auto-reverted): ${v.reason} - ${v.file}`
          : `File contract violation: ${v.reason} - ${v.file}`,
        file: v.file,
        raw: { violation: v, reverted: wasReverted },
      });
    }

    return { violations, revertedFiles, issues };
  }

  /**
   * Revert a single file to its last committed state.
   */
  private async revertFile(file: string, isNew: boolean): Promise<void> {
    if (isNew) {
      // For new files, remove them
      await execa("git", ["rm", "-f", file], {
        cwd: this.repoRoot,
        stdio: "pipe",
        reject: false,
      });
    } else {
      // For modified files, checkout from HEAD
      await execa("git", ["checkout", "HEAD", "--", file], {
        cwd: this.repoRoot,
        stdio: "pipe",
      });
    }
  }

  /**
   * Get list of changed files in the working directory.
   */
  async getChangedFiles(): Promise<Array<{ file: string; isNew: boolean }>> {
    // Get staged + unstaged changes
    const res = await execa("git", ["status", "--porcelain"], {
      cwd: this.repoRoot,
      stdio: "pipe",
    });

    const lines = res.stdout
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const changed: Array<{ file: string; isNew: boolean }> = [];
    for (const line of lines) {
      // Format: XY filename or XY -> filename (for renames)
      const status = line.substring(0, 2);
      let file = line.substring(3);

      // Handle renames: "R  old -> new"
      if (file.includes(" -> ")) {
        file = file.split(" -> ")[1] ?? file;
      }

      const isNew = status.includes("A") || status.includes("?");
      changed.push({ file, isNew });
    }

    return changed;
  }
}

/**
 * Quick helper to enforce contract on current changes.
 */
export async function enforceFileContract(args: {
  repoRoot: string;
  contract: FileContract;
  autoRevert?: boolean;
}): Promise<EnforcementResult> {
  const enforcer = new ContractEnforcer(args.repoRoot);
  const changedFiles = await enforcer.getChangedFiles();
  return enforcer.enforce({
    changedFiles,
    contract: args.contract,
    autoRevert: args.autoRevert,
  });
}
