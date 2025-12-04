"use server";

import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { revalidatePath } from "next/cache";
import { scanForPackages } from "./scanner";
import { PackageInfo } from "./types";
import { getSafeReactVersion, getSafeNextVersion } from "./vulnerability";

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

    // Update React if vulnerable
    if (packageInfo.isReactVulnerable && packageInfo.reactVersion) {
      const safeVersion = getSafeReactVersion(packageInfo.reactVersion);
      if (safeVersion) {
        // Preserve the prefix (^, ~, or nothing)
        const prefix = packageInfo.reactVersion.match(/^[\^~]/)?.[0] || "";
        const newVersion = `${prefix}${safeVersion}`;

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

    // Update Next.js if vulnerable
    if (packageInfo.isNextVulnerable && packageInfo.nextVersion) {
      const safeVersion = getSafeNextVersion(packageInfo.nextVersion);
      if (safeVersion) {
        // Preserve the prefix (^, ~, or nothing)
        const prefix = packageInfo.nextVersion.match(/^[\^~]/)?.[0] || "";
        const newVersion = `${prefix}${safeVersion}`;

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
    revalidatePath("/");

    return {
      success: true,
      message: `Successfully upgraded and installed with ${packageInfo.packageManager || "npm"}`,
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
    "⬆️🔒️ Upgrade next and react to mitigate CVE-2025-55182 & CVE-2025-66478";

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

