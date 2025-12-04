"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { PackageCard } from "./PackageCard";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Filter, FilterX } from "lucide-react";
import { PackageInfo } from "@/lib/types";

interface PackageListClientProps {
  packages: PackageInfo[];
  initialFilter?: boolean;
}

export function PackageListClient({ packages, initialFilter = false }: PackageListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showOnlyVulnerable = initialFilter;

  const toggleFilter = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (showOnlyVulnerable) {
      params.delete("filter");
    } else {
      params.set("filter", "vulnerable");
    }
    router.push(`?${params.toString()}`);
  }, [router, searchParams, showOnlyVulnerable]);

  const vulnerableCount = packages.filter(
    (p) => p.isReactVulnerable || p.isNextVulnerable || p.isTypesReactVulnerable || p.isTypesReactDomVulnerable
  ).length;

  const filteredPackages = showOnlyVulnerable
    ? packages.filter((p) => p.isReactVulnerable || p.isNextVulnerable || p.isTypesReactVulnerable || p.isTypesReactDomVulnerable)
    : packages;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800">
          Found {packages.length} package{packages.length !== 1 ? "s" : ""}
          {showOnlyVulnerable && filteredPackages.length !== packages.length && (
            <span className="text-slate-500 font-normal text-base ml-2">
              (showing {filteredPackages.length})
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          {vulnerableCount > 0 ? (
            <>
              <Button
                variant={showOnlyVulnerable ? "default" : "outline"}
                size="sm"
                onClick={toggleFilter}
                className="gap-1.5"
              >
                {showOnlyVulnerable ? (
                  <FilterX className="h-4 w-4" />
                ) : (
                  <Filter className="h-4 w-4" />
                )}
                {showOnlyVulnerable ? "Show All" : "Vulnerable Only"}
              </Button>
              <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full text-sm font-medium">
                <AlertCircle className="h-4 w-4" />
                {vulnerableCount} vulnerable
              </span>
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-full text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              All secure
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {filteredPackages.map((pkg) => (
          <PackageCard key={pkg.path} packageInfo={pkg} />
        ))}
      </div>
    </div>
  );
}

