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
  typesReactVersion: string | null;
  typesReactDomVersion: string | null;
  isReactVulnerable: boolean;
  isNextVulnerable: boolean;
  isTypesReactVulnerable: boolean;
  isTypesReactDomVulnerable: boolean;
  // Target versions for upgrade
  targetNextVersion: string | null;
  packageManager: "npm" | "yarn" | "pnpm" | "bun" | null;
}

export interface ScanResult {
  basePath: string;
  packages: PackageInfo[];
}


