export interface PackageInfo {
  path: string;
  relativePath: string;
  gitBranch: string | null;
  defaultBranch: string | null;
  commitsBehindDefault: number | null;
  prodBranch: string | null;
  commitsBehindProd: number | null;
  uncommittedFiles: number | null;
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


