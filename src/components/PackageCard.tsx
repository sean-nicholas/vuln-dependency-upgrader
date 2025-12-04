"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PackageInfo } from "@/lib/types";
import { upgradePackage, commitAndPush } from "@/lib/actions";
import {
  GitBranch,
  Package,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ArrowUpCircle,
  GitCommit,
} from "lucide-react";

interface PackageCardProps {
  packageInfo: PackageInfo;
}

export function PackageCard({ packageInfo }: PackageCardProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isVulnerable =
    packageInfo.isReactVulnerable || packageInfo.isNextVulnerable;

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    setMessage(null);

    try {
      const result = await upgradePackage(packageInfo);
      if (result.success) {
        setMessage({ type: "success", text: result.message || "Upgraded!" });
      } else {
        setMessage({ type: "error", text: result.error || "Upgrade failed" });
      }
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleCommit = async () => {
    setIsCommitting(true);
    setMessage(null);

    try {
      const result = await commitAndPush(packageInfo);
      if (result.success) {
        setMessage({
          type: "success",
          text: result.message || "Committed and pushed!",
        });
      } else {
        setMessage({ type: "error", text: result.error || "Commit failed" });
      }
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <Card
      className={`transition-all ${
        isVulnerable
          ? "border-amber-300 bg-amber-50/50"
          : "border-emerald-200 bg-emerald-50/30"
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Package className="h-4 w-4 text-slate-500" />
            <span className="font-mono text-slate-700">
              {packageInfo.relativePath}
            </span>
          </CardTitle>
          {packageInfo.gitBranch && (
            <Badge variant="outline" className="font-mono text-xs">
              <GitBranch className="h-3 w-3 mr-1" />
              {packageInfo.gitBranch}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 mb-4">
          {packageInfo.reactVersion && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">React:</span>
              <Badge
                variant={packageInfo.isReactVulnerable ? "destructive" : "secondary"}
                className="font-mono"
              >
                {packageInfo.isReactVulnerable ? (
                  <AlertTriangle className="h-3 w-3 mr-1" />
                ) : (
                  <CheckCircle className="h-3 w-3 mr-1" />
                )}
                {packageInfo.reactVersion}
              </Badge>
            </div>
          )}
          {packageInfo.nextVersion && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Next.js:</span>
              <Badge
                variant={packageInfo.isNextVulnerable ? "destructive" : "secondary"}
                className="font-mono"
              >
                {packageInfo.isNextVulnerable ? (
                  <AlertTriangle className="h-3 w-3 mr-1" />
                ) : (
                  <CheckCircle className="h-3 w-3 mr-1" />
                )}
                {packageInfo.nextVersion}
              </Badge>
            </div>
          )}
          {packageInfo.packageManager && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Package Manager:</span>
              <Badge variant="outline" className="font-mono">
                {packageInfo.packageManager}
              </Badge>
            </div>
          )}
        </div>

        {message && (
          <div
            className={`mb-4 px-3 py-2 rounded-md text-sm ${
              message.type === "success"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {isVulnerable && (
          <div className="flex gap-2">
            <Button
              onClick={handleUpgrade}
              disabled={isUpgrading || isCommitting}
              size="sm"
              className="gap-2"
            >
              {isUpgrading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUpCircle className="h-4 w-4" />
              )}
              Upgrade Dependencies
            </Button>
            <Button
              onClick={handleCommit}
              disabled={isUpgrading || isCommitting}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {isCommitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GitCommit className="h-4 w-4" />
              )}
              Commit & Push
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

