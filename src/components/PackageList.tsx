import { scanPackages } from "@/lib/actions";
import { PackageListClient } from "./PackageListClient";
import { AlertCircle, PackageSearch } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PackageListProps {
  basePath: string;
  showOnlyVulnerable?: boolean;
}

export async function PackageList({ basePath, showOnlyVulnerable = false }: PackageListProps) {
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

  return <PackageListClient packages={packages} initialFilter={showOnlyVulnerable} />;
}


