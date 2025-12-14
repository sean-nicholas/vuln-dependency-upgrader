"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  checkoutDefaultBranch,
  checkoutProdBranch,
  commitAndPush,
  openInCursor,
  upgradePackage,
} from "@/lib/actions";
import { PackageInfo } from "@/lib/types";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpCircle,
  CheckCircle,
  Download,
  ExternalLink,
  FilePen,
  GitBranch,
  GitCommit,
  Home,
  Loader2,
  Package,
  Rocket,
} from "lucide-react";
import { useState } from "react";

interface PackageCardProps {
  packageInfo: PackageInfo;
}

export function PackageCard({ packageInfo }: PackageCardProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isCheckingOutProd, setIsCheckingOutProd] = useState(false);
  const [isOpeningCursor, setIsOpeningCursor] = useState(false);
  const [wasUpgraded, setWasUpgraded] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isVulnerable =
    packageInfo.isReactVulnerable ||
    packageInfo.isNextVulnerable ||
    packageInfo.isTypesReactVulnerable ||
    packageInfo.isTypesReactDomVulnerable;

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    setMessage(null);

    try {
      const result = await upgradePackage(packageInfo);
      if (result.success) {
        setMessage({ type: "success", text: result.message || "Upgraded!" });
        setWasUpgraded(true);
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

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    setMessage(null);

    try {
      const result = await checkoutDefaultBranch(packageInfo);
      if (result.success) {
        setMessage({
          type: "success",
          text: result.message || "Checked out!",
        });
      } else {
        setMessage({ type: "error", text: result.error || "Checkout failed" });
      }
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleCheckoutProd = async () => {
    setIsCheckingOutProd(true);
    setMessage(null);

    try {
      const result = await checkoutProdBranch(packageInfo);
      if (result.success) {
        setMessage({
          type: "success",
          text: result.message || "Checked out!",
        });
      } else {
        setMessage({ type: "error", text: result.error || "Checkout failed" });
      }
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setIsCheckingOutProd(false);
    }
  };

  const isOnProdBranch =
    packageInfo.gitBranch === "production" || packageInfo.gitBranch === "prod";

  const handleOpenInCursor = async () => {
    setIsOpeningCursor(true);
    setMessage(null);

    try {
      const result = await openInCursor(packageInfo);
      if (result.success) {
        setMessage({
          type: "success",
          text: result.message || "Opened in Cursor!",
        });
      } else {
        setMessage({ type: "error", text: result.error || "Failed to open" });
      }
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setIsOpeningCursor(false);
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
            <Button
              onClick={handleOpenInCursor}
              disabled={isOpeningCursor}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
              title="Open in Cursor"
            >
              {isOpeningCursor ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ExternalLink className="h-3.5 w-3.5" />
              )}
            </Button>
          </CardTitle>
          {packageInfo.gitBranch && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                <GitBranch className="h-3 w-3 mr-1" />
                {packageInfo.gitBranch}
              </Badge>
              {packageInfo.uncommittedFiles !== null &&
                packageInfo.uncommittedFiles > 0 && (
                  <Badge
                    variant="outline"
                    className="font-mono text-xs border-yellow-400 text-yellow-700 bg-yellow-50"
                  >
                    <FilePen className="h-3 w-3 mr-1" />
                    {packageInfo.uncommittedFiles} uncommitted
                  </Badge>
                )}
              {/* Show button if: not on default branch OR on default branch but behind remote */}
              {packageInfo.defaultBranch &&
                ((packageInfo.gitBranch !== "main" &&
                  packageInfo.gitBranch !== "master") ||
                  (packageInfo.commitsBehindDefault !== null &&
                    packageInfo.commitsBehindDefault > 0)) && (
                  <Button
                    onClick={handleCheckout}
                    disabled={
                      isUpgrading ||
                      isCommitting ||
                      isCheckingOut ||
                      isCheckingOutProd
                    }
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs gap-1.5"
                  >
                    {isCheckingOut ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : packageInfo.gitBranch === "main" ||
                      packageInfo.gitBranch === "master" ? (
                      <Download className="h-3 w-3" />
                    ) : (
                      <Home className="h-3 w-3" />
                    )}
                    {packageInfo.gitBranch === "main" ||
                    packageInfo.gitBranch === "master"
                      ? "Pull"
                      : packageInfo.defaultBranch}
                    {packageInfo.commitsBehindDefault !== null &&
                      packageInfo.commitsBehindDefault > 0 && (
                        <span className="ml-0.5 bg-blue-500 text-white px-1.5 py-0.5 rounded-full text-[10px] font-medium">
                          +{packageInfo.commitsBehindDefault}
                        </span>
                      )}
                  </Button>
                )}
              {/* Show prod button if: prod branch exists AND (not on prod branch OR behind remote) */}
              {packageInfo.prodBranch &&
                (!isOnProdBranch ||
                  (packageInfo.commitsBehindProd !== null &&
                    packageInfo.commitsBehindProd > 0)) && (
                  <Button
                    onClick={handleCheckoutProd}
                    disabled={
                      isUpgrading ||
                      isCommitting ||
                      isCheckingOut ||
                      isCheckingOutProd
                    }
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs gap-1.5 border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    {isCheckingOutProd ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : isOnProdBranch ? (
                      <Download className="h-3 w-3" />
                    ) : (
                      <Rocket className="h-3 w-3" />
                    )}
                    {isOnProdBranch ? "Pull" : packageInfo.prodBranch}
                    {packageInfo.commitsBehindProd !== null &&
                      packageInfo.commitsBehindProd > 0 && (
                        <span className="ml-0.5 bg-orange-500 text-white px-1.5 py-0.5 rounded-full text-[10px] font-medium">
                          +{packageInfo.commitsBehindProd}
                        </span>
                      )}
                  </Button>
                )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 mb-4">
          {packageInfo.reactVersion && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">React:</span>
              <Badge
                variant={
                  packageInfo.isReactVulnerable ? "destructive" : "secondary"
                }
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
                variant={
                  packageInfo.isNextVulnerable ? "destructive" : "secondary"
                }
                className="font-mono"
              >
                {packageInfo.isNextVulnerable ? (
                  <AlertTriangle className="h-3 w-3 mr-1" />
                ) : (
                  <CheckCircle className="h-3 w-3 mr-1" />
                )}
                {packageInfo.nextVersion}
              </Badge>
              {packageInfo.isNextVulnerable && packageInfo.targetNextVersion && (
                <>
                  <ArrowRight className="h-3 w-3 text-slate-400" />
                  <Badge variant="secondary" className="font-mono bg-emerald-100 text-emerald-800 border-emerald-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {packageInfo.targetNextVersion}
                  </Badge>
                </>
              )}
            </div>
          )}
          {packageInfo.typesReactVersion && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">@types/react:</span>
              <Badge
                variant={
                  packageInfo.isTypesReactVulnerable
                    ? "destructive"
                    : "secondary"
                }
                className="font-mono"
              >
                {packageInfo.isTypesReactVulnerable ? (
                  <AlertTriangle className="h-3 w-3 mr-1" />
                ) : (
                  <CheckCircle className="h-3 w-3 mr-1" />
                )}
                {packageInfo.typesReactVersion}
              </Badge>
            </div>
          )}
          {packageInfo.typesReactDomVersion && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">@types/react-dom:</span>
              <Badge
                variant={
                  packageInfo.isTypesReactDomVulnerable
                    ? "destructive"
                    : "secondary"
                }
                className="font-mono"
              >
                {packageInfo.isTypesReactDomVulnerable ? (
                  <AlertTriangle className="h-3 w-3 mr-1" />
                ) : (
                  <CheckCircle className="h-3 w-3 mr-1" />
                )}
                {packageInfo.typesReactDomVersion}
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

        {(isVulnerable || wasUpgraded) && (
          <div className="flex gap-2">
            {isVulnerable && (
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
            )}
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
