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

  const gitBranch = await getGitBranch(dirPath);
  const packageManager = await detectPackageManager(dirPath);

  // Create relative path by removing the basePath prefix
  let relativePath = packageJsonPath;
  if (packageJsonPath.startsWith(basePath)) {
    relativePath = packageJsonPath.slice(basePath.length);
    if (relativePath.startsWith("/")) {
      relativePath = relativePath.slice(1);
    }
  }

  return {
    path: packageJsonPath,
    relativePath,
    gitBranch,
    reactVersion,
    nextVersion,
    isReactVulnerable: isReactVulnerable(reactVersion),
    isNextVulnerable: isNextVulnerable(nextVersion),
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

