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
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

interface CloneStatus {
  step: string;
  completed: boolean;
  error?: string;
}

const GitCloneDialog: React.FC<GitCloneDialogProps> = ({
  open,
  onOpenChange,
  trigger,
  onSuccess,
}) => {
  const t = useTranslations();
  const [repoUrl, setRepoUrl] = useState("");
  const [projectName, setProjectName] = useState("");
  const [isCloning, setIsCloning] = useState(false);
  const [installDeps, setInstallDeps] = useState(true);
  const [cloneStatus, setCloneStatus] = useState<CloneStatus[]>([]);
  const [error, setError] = useState<string | null>(null);

  const validateGitUrl = (url: string): boolean => {
    const gitUrlPattern = /^(https?:\/\/)?(www\.)?(github|gitlab|bitbucket)\.(com|org)\/[\w\-\.]+\/[\w\-\.]+\.git?$/i;
    return gitUrlPattern.test(url) || url.includes("github.com") || url.includes("gitlab.com") || url.includes("bitbucket.org");
  };

  const extractProjectName = (url: string): string => {
    const match = url.match(/\/([^\/]+)\.git?$/);
    if (match && match[1]) {
      return match[1];
    }
    // Fallback: extract from URL path
    const pathMatch = url.match(/\/([^\/]+)\/?$/);
    return pathMatch && pathMatch[1] ? pathMatch[1] : "project";
  };

  const updateStatus = (step: string, completed: boolean, error?: string) => {
    setCloneStatus(prev => {
      const existing = prev.find(s => s.step === step);
      if (existing) {
        return prev.map(s => s.step === step ? { ...s, completed, error } : s);
      }
      return [...prev, { step, completed, error }];
    });
  };

  const handleClone = useCallback(async () => {
    if (!repoUrl.trim()) {
      setError("Please enter a repository URL");
      return;
    }

    if (!validateGitUrl(repoUrl)) {
      setError("Invalid Git repository URL");
      return;
    }

    setIsCloning(true);
    setError(null);
    setCloneStatus([]);

    try {
      const instance = await getWebContainerInstance();
      const finalProjectName = projectName.trim() || extractProjectName(repoUrl);

      // Step 1: Clone repository
      updateStatus("Cloning repository", false);
      
      // Create project directory
      await instance.fs.mkdir(finalProjectName, { recursive: true });
      
      // Clone the repository
      const cloneProcess = await instance.spawn("git", ["clone", repoUrl, finalProjectName]);
      
      let cloneOutput = "";
      cloneProcess.output.pipeTo(new WritableStream({
        write(data) {
          cloneOutput += data;
        }
      }));

      const cloneExitCode = await cloneProcess.exit;
      
      if (cloneExitCode !== 0) {
        updateStatus("Cloning repository", false, "Failed to clone repository");
        setError("Failed to clone repository. Please check the URL and try again.");
        return;
      }
      
      updateStatus("Cloning repository", true);

      // Step 2: Change to project directory
      updateStatus("Setting up project", false);
      
      // Check if package.json exists
      let hasPackageJson = false;
      try {
        await instance.fs.readFile(`${finalProjectName}/package.json`, "utf-8");
        hasPackageJson = true;
      } catch {
        // package.json doesn't exist, that's fine
      }

      updateStatus("Setting up project", true);

      // Step 3: Install dependencies (if package.json exists and user wants to install)
      if (hasPackageJson && installDeps) {
        updateStatus("Installing dependencies", false);
        
        // Change to project directory and install dependencies
        const installProcess = await instance.spawn("sh", ["-c", `cd ${finalProjectName} && npm install`]);
        
        let installOutput = "";
        installProcess.output.pipeTo(new WritableStream({
          write(data) {
            installOutput += data;
          }
        }));

        const installExitCode = await installProcess.exit;
        
        if (installExitCode !== 0) {
          updateStatus("Installing dependencies", false, "Failed to install dependencies");
          // Don't fail the entire process, just show warning
        } else {
          updateStatus("Installing dependencies", true);
        }
      }

      // Success
      setTimeout(() => {
        onSuccess?.();
        onOpenChange?.(false);
        setRepoUrl("");
        setProjectName("");
        setCloneStatus([]);
      }, 1000);

    } catch (error) {
      console.error("Clone error:", error);
      setError(`Clone failed: ${error}`);
    } finally {
      setIsCloning(false);
    }
  }, [repoUrl, projectName, installDeps, onSuccess, onOpenChange]);

  const handleUrlChange = (url: string) => {
    setRepoUrl(url);
    if (url && !projectName) {
      setProjectName(extractProjectName(url));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Clone Git Repository
          </DialogTitle>
          <DialogDescription>
            Clone a Git repository into your WebContainer environment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="repo-url">Repository URL</Label>
            <Input
              id="repo-url"
              placeholder="https://github.com/username/repository.git"
              value={repoUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              disabled={isCloning}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name (optional)</Label>
            <Input
              id="project-name"
              placeholder="Will be extracted from URL if empty"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              disabled={isCloning}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="install-deps"
              checked={installDeps}
              onCheckedChange={(checked) => setInstallDeps(checked === true)}
              disabled={isCloning}
            />
            <Label htmlFor="install-deps" className="text-sm">
              Install dependencies (npm install) if package.json exists
            </Label>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {cloneStatus.length > 0 && (
            <div className="space-y-2">
              {cloneStatus.map((status, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  {status.completed ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : status.error ? (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <span className={status.error ? "text-red-500" : ""}>
                    {status.step}
                    {status.error && `: ${status.error}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange?.(false)}
            disabled={isCloning}
          >
            Cancel
          </Button>
          <Button
            onClick={handleClone}
            disabled={isCloning || !repoUrl.trim()}
          >
            {isCloning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cloning...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Clone Repository
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GitCloneDialog;