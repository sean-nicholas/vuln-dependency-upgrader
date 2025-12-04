import { Suspense } from "react";
import { PathForm } from "@/components/PathForm";
import { PackageList } from "@/components/PackageList";
import { Loader2, ShieldAlert } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ path?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const { path } = await searchParams;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <ShieldAlert className="h-10 w-10 text-amber-600" />
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              Dependency Upgrader
            </h1>
          </div>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Scan your projects for vulnerable React and Next.js versions and
            upgrade them with one click.
          </p>
        </header>

        <PathForm initialPath={path} />

        {path && (
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                <span className="ml-3 text-slate-600">Scanning packages...</span>
              </div>
            }
          >
            <PackageList basePath={path} />
          </Suspense>
        )}
      </div>
    </main>
  );
}
