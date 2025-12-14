"use server";

import { exec } from "child_process";
import fs from "fs/promises";
import { revalidatePath } from "next/cache";
import path from "path";
import { promisify } from "util";
import { scanForPackages } from "./scanner";
import { PackageInfo } from "./types";
import { getSafeNextVersion, getSafeReactVersion, getSafeTypesReactVersion, getSafeTypesReactDomVersion } from "./vulnerability";

const execAsync = promisify(exec);

export async function scanPackages(basePath: string) {
  try {
    const packages = await scanForPackages(basePath);
    return { success: true, packages };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function upgradePackage(packageInfo: PackageInfo) {
  const dirPath = path.dirname(packageInfo.path);

  try {
    // Read the package.json
    const content = await fs.readFile(packageInfo.path, "utf-8");
    const packageJson = JSON.parse(content);

    let hasChanges = false;

    // Helper to build new version preserving original prefix (or no prefix)
    const buildNewVersion = (
      originalVersion: string,
      safeVersion: string
    ): string => {
      const prefixMatch = originalVersion.match(/^([\^~])/);
      // Only add prefix if original had one
      if (prefixMatch) {
        return `${prefixMatch[1]}${safeVersion}`;
      }
      // No prefix in original = no prefix in new version
      return safeVersion;
    };

    // Update React if vulnerable
    if (packageInfo.isReactVulnerable && packageInfo.reactVersion) {
      const safeVersion = getSafeReactVersion(packageInfo.reactVersion);
      if (safeVersion) {
        // Get the actual version from package.json to check prefix
        const actualReactVersion =
          packageJson.dependencies?.react || packageJson.devDependencies?.react;
        const newVersion = buildNewVersion(
          actualReactVersion || packageInfo.reactVersion,
          safeVersion
        );

        if (packageJson.dependencies?.react) {
          packageJson.dependencies.react = newVersion;
          hasChanges = true;
        }
        if (packageJson.devDependencies?.react) {
          packageJson.devDependencies.react = newVersion;
          hasChanges = true;
        }
        // Also update react-dom if present
        if (packageJson.dependencies?.["react-dom"]) {
          packageJson.dependencies["react-dom"] = newVersion;
        }
        if (packageJson.devDependencies?.["react-dom"]) {
          packageJson.devDependencies["react-dom"] = newVersion;
        }
      }
    }

    // Update @types/react if vulnerable
    if (packageInfo.isTypesReactVulnerable && packageInfo.typesReactVersion) {
      const safeVersion = getSafeTypesReactVersion(packageInfo.typesReactVersion);
      if (safeVersion) {
        const actualVersion =
          packageJson.devDependencies?.["@types/react"] || packageJson.dependencies?.["@types/react"];
        const newVersion = buildNewVersion(
          actualVersion || packageInfo.typesReactVersion,
          safeVersion
        );

        if (packageJson.devDependencies?.["@types/react"]) {
          packageJson.devDependencies["@types/react"] = newVersion;
          hasChanges = true;
        }
        if (packageJson.dependencies?.["@types/react"]) {
          packageJson.dependencies["@types/react"] = newVersion;
          hasChanges = true;
        }
      }
    }

    // Update @types/react-dom if vulnerable
    if (packageInfo.isTypesReactDomVulnerable && packageInfo.typesReactDomVersion) {
      const safeVersion = getSafeTypesReactDomVersion(packageInfo.typesReactDomVersion);
      if (safeVersion) {
        const actualVersion =
          packageJson.devDependencies?.["@types/react-dom"] || packageJson.dependencies?.["@types/react-dom"];
        const newVersion = buildNewVersion(
          actualVersion || packageInfo.typesReactDomVersion,
          safeVersion
        );

        if (packageJson.devDependencies?.["@types/react-dom"]) {
          packageJson.devDependencies["@types/react-dom"] = newVersion;
          hasChanges = true;
        }
        if (packageJson.dependencies?.["@types/react-dom"]) {
          packageJson.dependencies["@types/react-dom"] = newVersion;
          hasChanges = true;
        }
      }
    }

    // Update Next.js if vulnerable
    if (packageInfo.isNextVulnerable && packageInfo.nextVersion) {
      const safeVersion = getSafeNextVersion(packageInfo.nextVersion);
      if (safeVersion) {
        // Get the actual version from package.json to check prefix
        const actualNextVersion =
          packageJson.dependencies?.next || packageJson.devDependencies?.next;
        const newVersion = buildNewVersion(
          actualNextVersion || packageInfo.nextVersion,
          safeVersion
        );

        if (packageJson.dependencies?.next) {
          packageJson.dependencies.next = newVersion;
          hasChanges = true;
        }
        if (packageJson.devDependencies?.next) {
          packageJson.devDependencies.next = newVersion;
          hasChanges = true;
        }
      }
    }

    if (!hasChanges) {
      return { success: true, message: "No changes needed" };
    }

    // Write the updated package.json
    await fs.writeFile(
      packageInfo.path,
      JSON.stringify(packageJson, null, 2) + "\n",
      "utf-8"
    );

    // Determine the install command
    let installCommand: string;
    switch (packageInfo.packageManager) {
      case "bun":
        installCommand = "bun install";
        break;
      case "pnpm":
        installCommand = "pnpm install";
        break;
      case "yarn":
        installCommand = "yarn install";
        break;
      case "npm":
      default:
        installCommand = "npm install";
        break;
    }

    // Run the install command
    await execAsync(installCommand, { cwd: dirPath });

    // Revalidate the page
    // revalidatePath("/");

    return {
      success: true,
      message: `Successfully upgraded and installed with ${
        packageInfo.packageManager || "npm"
      }`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function commitAndPush(packageInfo: PackageInfo) {
  const dirPath = path.dirname(packageInfo.path);
  const commitMessage =
    "⬆️🔒️ Upgrade Next.js to mitigate CVE-2025-55184, CVE-2025-55183 & CVE-2025-67779";

  try {
    // Stage all changes
    await execAsync("git add -A", { cwd: dirPath });

    // Commit
    await execAsync(`git commit -m "${commitMessage}"`, { cwd: dirPath });

    // Push
    await execAsync("git push", { cwd: dirPath });

    // Revalidate the page
    revalidatePath("/");

    return { success: true, message: "Successfully committed and pushed" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function checkoutDefaultBranch(packageInfo: PackageInfo) {
  const dirPath = path.dirname(packageInfo.path);

  try {
    // Check which default branch exists (main or master)
    let defaultBranch: string | null = null;

    try {
      await execAsync("git rev-parse --verify main", { cwd: dirPath });
      defaultBranch = "main";
    } catch {
      try {
        await execAsync("git rev-parse --verify master", { cwd: dirPath });
        defaultBranch = "master";
      } catch {
        return {
          success: false,
          error: "Neither 'main' nor 'master' branch found",
        };
      }
    }

    // Checkout the default branch
    await execAsync(`git checkout ${defaultBranch}`, { cwd: dirPath });

    // Pull latest changes
    await execAsync("git pull", { cwd: dirPath });

    // Revalidate the page
    revalidatePath("/");

    return {
      success: true,
      message: `Switched to ${defaultBranch} and pulled latest changes`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function checkoutProdBranch(packageInfo: PackageInfo) {
  const dirPath = path.dirname(packageInfo.path);

  try {
    // Check which prod branch exists (production or prod)
    let prodBranch: string | null = null;

    try {
      await execAsync("git rev-parse --verify origin/production", {
        cwd: dirPath,
      });
      prodBranch = "production";
    } catch {
      try {
        await execAsync("git rev-parse --verify origin/prod", { cwd: dirPath });
        prodBranch = "prod";
      } catch {
        return {
          success: false,
          error: "Neither 'production' nor 'prod' branch found",
        };
      }
    }

    // Check if local branch exists, if not create it tracking remote
    try {
      await execAsync(`git rev-parse --verify ${prodBranch}`, { cwd: dirPath });
      // Local branch exists, checkout and pull
      await execAsync(`git checkout ${prodBranch}`, { cwd: dirPath });
    } catch {
      // Local branch doesn't exist, create it tracking remote
      await execAsync(`git checkout -b ${prodBranch} origin/${prodBranch}`, {
        cwd: dirPath,
      });
    }

    // Pull latest changes
    await execAsync("git pull", { cwd: dirPath });

    // Revalidate the page
    revalidatePath("/");

    return {
      success: true,
      message: `Switched to ${prodBranch} and pulled latest changes`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function openInCursor(packageInfo: PackageInfo) {
  const dirPath = path.dirname(packageInfo.path);

  try {
    // Open the directory in Cursor
    await execAsync(`cursor "${dirPath}"`, { cwd: dirPath });

    return {
      success: true,
      message: `Opened ${dirPath} in Cursor`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

