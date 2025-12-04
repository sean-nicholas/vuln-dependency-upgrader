import { scanPackages } from "@/lib/actions";
import { PackageCard } from "./PackageCard";
import { AlertCircle, CheckCircle2, PackageSearch } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PackageListProps {
  basePath: string;
}

export async function PackageList({ basePath }: PackageListProps) {
  const result = await scanPackages(basePath);

  if (!result.success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-3 text-red-700">
            <AlertCircle className="h-6 w-6" />
            <span className="text-lg">Error: {result.error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const packages = result.packages || [];

  if (packages.length === 0) {
    return (
      <Card className="border-slate-200">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
            <PackageSearch className="h-12 w-12" />
            <span className="text-lg">No package.json files found</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const vulnerableCount = packages.filter(
    (p) => p.isReactVulnerable || p.isNextVulnerable
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800">
          Found {packages.length} package{packages.length !== 1 ? "s" : ""}
        </h2>
        <div className="flex items-center gap-2">
          {vulnerableCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full text-sm font-medium">
              <AlertCircle className="h-4 w-4" />
              {vulnerableCount} vulnerable
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-full text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              All secure
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {packages.map((pkg) => (
          <PackageCard key={pkg.path} packageInfo={pkg} />
        ))}
      </div>
    </div>
  );
}

