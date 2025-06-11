"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  GitBranch,
  Github,
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { useTranslations } from "next-intl";
import { getWebContainerInstance } from "@/components/WebContainer";
import { Checkbox } from "@workspace/ui/components/checkbox";

interface GitCloneDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCloneComplete?: (success: boolean, repoName?: string) => void;
  triggerButton?: React.ReactNode;
}

export function GitCloneDialog({
  open,
  onOpenChange,
  onCloneComplete,
  triggerButton,
}: GitCloneDialogProps) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [cloneStep, setCloneStep] = useState<string>("");
  const [repoUrl, setRepoUrl] = useState("");
  const [installDependencies, setInstallDependencies] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Use external open state if provided, otherwise use internal state
  const dialogOpen = open !== undefined ? open : isOpen;
  const setDialogOpen = onOpenChange || setIsOpen;

  const validateGitUrl = (url: string): boolean => {
    const gitPatterns = [
      /^https:\/\/github\.com\/[\w\-_]+\/[\w\-_.]+(?:\.git)?$/,
      /^git@github\.com:[\w\-_]+\/[\w\-_.]+(?:\.git)?$/,
      /^https:\/\/gitlab\.com\/[\w\-_]+\/[\w\-_.]+(?:\.git)?$/,
      /^git@gitlab\.com:[\w\-_]+\/[\w\-_.]+(?:\.git)?$/,
      /^https:\/\/bitbucket\.org\/[\w\-_]+\/[\w\-_.]+(?:\.git)?$/,
      /^git@bitbucket\.org:[\w\-_]+\/[\w\-_.]+(?:\.git)?$/,
    ];
    return gitPatterns.some((pattern) => pattern.test(url));
  };
  const extractRepoName = (url: string): string => {
    const match = url.match(/\/([^\/]+?)(?:\.git)?$/);
    return match?.[1] || "cloned-repo";
  };
  const handleClone = useCallback(async () => {
    if (!repoUrl.trim()) {
      setError(
        t("gitClone.errors.emptyUrl") || "Please enter a repository URL",
      );
      return;
    }

    if (!validateGitUrl(repoUrl)) {
      setError(
        t("gitClone.errors.invalidUrl") ||
          "Please enter a valid Git repository URL",
      );
      return;
    }
    setIsCloning(true);
    setError(null);
    setSuccess(false);
    setCloneStep("");

    try {
      const webContainer = getWebContainerInstance();
      if (!webContainer) {
        throw new Error("WebContainer instance not available");
      }

      //   // Check if directory already exists
      //   try {
      //     await webContainer.fs.readdir(clonePath);
      //     setError(t("gitClone.errors.directoryExists") || `Directory '${targetDir}' already exists`);
      //     return;
      //   } catch {
      //     // Directory doesn't exist, which is what we want
      //   }
      // Install isomorphic-git and http dependencies in WebContainer
      setCloneStep(t("gitClone.cloningRepository") || "Cloning repository...");

      const cloneProcess = await webContainer.spawn("pnpm", [
        "dlx",
        "isomorphic-git",
        "clone",
        `--url=${repoUrl}`,
        `--dir=./`,
        "--single-branch",
        "--depth=1",
      ]);

      // Wait for the clone process to complete
      const exitCode = await cloneProcess.exit;

      if (exitCode === 0) {
        // Reset form after successful clone
        try {
          await webContainer.fs.rm("pnpm-lock.yaml");
        } catch (err) {
          console.warn("pnpm-lock.yaml not found, skipping removal");
        }

        if (installDependencies) {
          setCloneStep(
            t("gitClone.installingDependencies") ||
              "Installing dependencies...",
          );
          const installProcess = await webContainer.spawn("pnpm", ["install"]);
          const installExitCode = await installProcess.exit;
          if (installExitCode !== 0) {
            throw new Error(
              t("gitClone.errors.installFailed") ||
                "Failed to install dependencies",
            );
          }
        }

        setSuccess(true);
        onCloneComplete?.(true);

        setTimeout(() => {
          setRepoUrl("");
          setDialogOpen(false);
          setSuccess(false);
        }, 2000);
      } else {
        throw new Error("Git clone failed with exit code: " + exitCode);
      }
    } catch (err: any) {
      console.error("Error cloning repository:", err);
      setError(
        t("gitClone.errors.cloneFailed") ||
          `Failed to clone repository: ${err.message}`,
      );
      onCloneComplete?.(false);
    } finally {
      setIsCloning(false);
      setCloneStep("");
    }
  }, [repoUrl, onCloneComplete, t]);
  const handleClose = () => {
    if (!isCloning) {
      setDialogOpen(false);
      setError(null);
      setSuccess(false);
      setRepoUrl("");
    }
  };

  const isValidUrl = repoUrl.trim() && validateGitUrl(repoUrl);
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <GitBranch className="h-4 w-4" />
            {t("gitClone.title") || "Clone Repository"}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            {t("gitClone.title") || "Clone Git Repository"}
          </DialogTitle>
          <DialogDescription>
            {t("gitClone.description") ||
              "Clone a Git repository into your WebContainer workspace"}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}{" "}
        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              {t("gitClone.success") || "Repository cloned successfully!"}
            </AlertDescription>
          </Alert>
        )}
        {isCloning && cloneStep && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>{cloneStep}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="repo-url">
              {t("gitClone.repositoryUrl") || "Repository URL"}
            </Label>{" "}
            <Input
              id="repo-url"
              type="url"
              placeholder={
                t("gitClone.repositoryUrlPlaceholder") ||
                "https://github.com/username/repository.git"
              }
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              disabled={isCloning}
            />
            <p className="text-xs text-muted-foreground">
              {t("gitClone.urlHint") ||
                "Supports GitHub, GitLab, and Bitbucket URLs"}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="install-dependencies"
              checked={installDependencies}
              onCheckedChange={(checked) =>
                setInstallDependencies(Boolean(checked))
              }
            />
            <Label htmlFor="install-dependencies">
              {t("gitClone.installDependencies") || "Install Dependencies"}
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isCloning}>
            {t("common.cancel") || "Cancel"}
          </Button>{" "}
          <Button onClick={handleClone} disabled={!isValidUrl || isCloning}>
            {isCloning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}

            {isCloning
              ? cloneStep || t("gitClone.cloning") || "Cloning..."
              : t("gitClone.clone") || "Clone"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default GitCloneDialog;
