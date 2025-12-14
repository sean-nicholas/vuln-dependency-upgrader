import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { PackageInfo } from "./types";
import { isReactVulnerable, isNextVulnerable } from "./vulnerability";

const execAsync = promisify(exec);

const MAX_DEPTH = 4;

async function getGitBranch(dirPath: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync("git rev-parse --abbrev-ref HEAD", {
      cwd: dirPath,
    });
    return stdout.trim();
  } catch {
    return null;
  }
}

async function getUncommittedFilesCount(dirPath: string): Promise<number | null> {
  try {
    const { stdout } = await execAsync("git status --porcelain", {
      cwd: dirPath,
    });
    // Each line represents a changed file
    const lines = stdout.trim().split("\n").filter((line) => line.length > 0);
    return lines.length;
  } catch {
    return null;
  }
}

async function getDefaultBranchInfo(
  dirPath: string
): Promise<{ defaultBranch: string | null; commitsBehind: number | null }> {
  try {
    // Try to fetch latest info from remote (silent fail if offline)
    try {
      await execAsync("git fetch --quiet", { cwd: dirPath, timeout: 5000 });
    } catch {
      // Ignore fetch errors (might be offline)
    }

    // Check which default branch exists
    let defaultBranch: string | null = null;

    try {
      await execAsync("git rev-parse --verify main", { cwd: dirPath });
      defaultBranch = "main";
    } catch {
      try {
        await execAsync("git rev-parse --verify master", { cwd: dirPath });
        defaultBranch = "master";
      } catch {
        return { defaultBranch: null, commitsBehind: null };
      }
    }

    // Count commits behind remote
    try {
      const { stdout } = await execAsync(
        `git rev-list --count ${defaultBranch}..origin/${defaultBranch}`,
        { cwd: dirPath }
      );
      const commitsBehind = parseInt(stdout.trim(), 10);
      return { defaultBranch, commitsBehind: isNaN(commitsBehind) ? null : commitsBehind };
    } catch {
      // No remote tracking branch or other error
      return { defaultBranch, commitsBehind: null };
    }
  } catch {
    return { defaultBranch: null, commitsBehind: null };
  }
}

async function getProdBranchInfo(
  dirPath: string
): Promise<{ prodBranch: string | null; commitsBehind: number | null }> {
  try {
    // Check which prod branch exists on remote (production or prod)
    let prodBranch: string | null = null;

    try {
      await execAsync("git rev-parse --verify origin/production", { cwd: dirPath });
      prodBranch = "production";
    } catch {
      try {
        await execAsync("git rev-parse --verify origin/prod", { cwd: dirPath });
        prodBranch = "prod";
      } catch {
        return { prodBranch: null, commitsBehind: null };
      }
    }

    // Count commits behind remote prod branch
    try {
      // Check if local branch exists
      try {
        await execAsync(`git rev-parse --verify ${prodBranch}`, { cwd: dirPath });
      } catch {
        // Local branch doesn't exist, can't count commits behind
        return { prodBranch, commitsBehind: null };
      }

      const { stdout } = await execAsync(
        `git rev-list --count ${prodBranch}..origin/${prodBranch}`,
        { cwd: dirPath }
      );
      const commitsBehind = parseInt(stdout.trim(), 10);
      return { prodBranch, commitsBehind: isNaN(commitsBehind) ? null : commitsBehind };
    } catch {
      return { prodBranch, commitsBehind: null };
    }
  } catch {
    return { prodBranch: null, commitsBehind: null };
  }
}

function detectPackageManager(
  dirPath: string
): Promise<"npm" | "yarn" | "pnpm" | "bun" | null> {
  return (async () => {
    const files = await fs.readdir(dirPath);
    
    if (files.includes("bun.lockb") || files.includes("bun.lock")) {
      return "bun";
    }
    if (files.includes("pnpm-lock.yaml")) {
      return "pnpm";
    }
    if (files.includes("yarn.lock")) {
      return "yarn";
    }
    if (files.includes("package-lock.json")) {
      return "npm";
    }
    
    return null;
  })();
}

async function findPackageJsons(
  basePath: string,
  currentPath: string,
  depth: number = 0
): Promise<string[]> {
  if (depth > MAX_DEPTH) {
    return [];
  }

  const results: string[] = [];

  try {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    // Check if package.json exists in current directory
    const hasPackageJson = entries.some(
      (entry) => entry.isFile() && entry.name === "package.json"
    );

    if (hasPackageJson) {
      results.push(path.join(currentPath, "package.json"));
    }

    // Recursively search subdirectories (skip node_modules)
    for (const entry of entries) {
      if (
        entry.isDirectory() &&
        entry.name !== "node_modules" &&
        !entry.name.startsWith(".")
      ) {
        const subResults = await findPackageJsons(
          basePath,
          path.join(currentPath, entry.name),
          depth + 1
        );
        results.push(...subResults);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${currentPath}:`, error);
  }

  return results;
}

async function analyzePackageJson(
  packageJsonPath: string,
  basePath: string
): Promise<PackageInfo> {
  const dirPath = path.dirname(packageJsonPath);
  const content = await fs.readFile(packageJsonPath, "utf-8");
  const packageJson = JSON.parse(content);

  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};

  const reactVersion = dependencies.react || devDependencies.react || null;
  const nextVersion = dependencies.next || devDependencies.next || null;
  const typesReactVersion = devDependencies["@types/react"] || dependencies["@types/react"] || null;
  const typesReactDomVersion = devDependencies["@types/react-dom"] || dependencies["@types/react-dom"] || null;

  const gitBranch = await getGitBranch(dirPath);
  const packageManager = await detectPackageManager(dirPath);
  const { defaultBranch, commitsBehind } = await getDefaultBranchInfo(dirPath);
  const { prodBranch, commitsBehind: commitsBehindProd } = await getProdBranchInfo(dirPath);
  const uncommittedFiles = await getUncommittedFilesCount(dirPath);

  // Create relative path by removing the basePath prefix
  let relativePath = packageJsonPath;
  if (packageJsonPath.startsWith(basePath)) {
    relativePath = packageJsonPath.slice(basePath.length);
    if (relativePath.startsWith("/")) {
      relativePath = relativePath.slice(1);
    }
  }

  // Check Next.js vulnerability first
  const nextVulnerable = isNextVulnerable(nextVersion);
  
  // React is only shown as vulnerable if Next.js is also vulnerable
  // because the fix for React CVEs comes via Next.js upgrade (react-server-dom-* packages)
  // If Next.js is already patched, React is effectively protected
  const reactVulnerable = nextVulnerable && isReactVulnerable(reactVersion);

  return {
    path: packageJsonPath,
    relativePath,
    gitBranch,
    defaultBranch,
    commitsBehindDefault: commitsBehind,
    prodBranch,
    commitsBehindProd,
    uncommittedFiles,
    reactVersion,
    nextVersion,
    typesReactVersion,
    typesReactDomVersion,
    isReactVulnerable: reactVulnerable,
    isNextVulnerable: nextVulnerable,
    // @types packages are just TypeScript definitions, not runtime code - no security concern
    // They'll be updated silently along with the main packages
    isTypesReactVulnerable: false,
    isTypesReactDomVulnerable: false,
    packageManager,
  };
}

export async function scanForPackages(basePath: string): Promise<PackageInfo[]> {
  // Normalize the path
  const normalizedPath = path.resolve(basePath);

  // Check if the path exists
  try {
    await fs.access(normalizedPath);
  } catch {
    throw new Error(`Path does not exist: ${normalizedPath}`);
  }

  const packageJsonPaths = await findPackageJsons(
    normalizedPath,
    normalizedPath,
    0
  );

  const packages = await Promise.all(
    packageJsonPaths.map((p) => analyzePackageJson(p, normalizedPath))
  );

  return packages;
}


