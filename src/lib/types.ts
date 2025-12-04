export interface PackageInfo {
  path: string;
  relativePath: string;
  gitBranch: string | null;
  reactVersion: string | null;
  nextVersion: string | null;
  isReactVulnerable: boolean;
  isNextVulnerable: boolean;
  packageManager: "npm" | "yarn" | "pnpm" | "bun" | null;
}

export interface ScanResult {
  basePath: string;
  packages: PackageInfo[];
}

