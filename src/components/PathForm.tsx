"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FolderSearch } from "lucide-react";

interface PathFormProps {
  initialPath?: string;
}

export function PathForm({ initialPath }: PathFormProps) {
  const [path, setPath] = useState(initialPath || "");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (path.trim()) {
      const params = new URLSearchParams({ path: path.trim() });
      router.push(`/?${params.toString()}`);
    }
  };

  return (
    <Card className="mb-8 border-slate-200 shadow-sm">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <FolderSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Enter folder path (e.g., /Users/dev/projects)"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              className="pl-11 h-12 text-base"
            />
          </div>
          <Button type="submit" size="lg" className="px-8">
            Scan
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}


