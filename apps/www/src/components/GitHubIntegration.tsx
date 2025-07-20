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
import { Textarea } from "@workspace/ui/components/textarea";
import {
  Github,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { useTranslations } from "next-intl";
import { getWebContainerInstance } from "@/components/WebContainer";

interface GitHubIntegrationProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

interface CreatePRStatus {
  step: string;
  completed: boolean;
  error?: string;
}

const GitHubIntegration: React.FC<GitHubIntegrationProps> = ({
  open,
  onOpenChange,
  trigger,
  onSuccess,
}) => {
  const t = useTranslations();
  const [repoUrl, setRepoUrl] = useState("");
  const [branchName, setBranchName] = useState("");
  const [prTitle, setPrTitle] = useState("");
  const [prDescription, setPrDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createStatus, setCreateStatus] = useState<CreatePRStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);

  const updateStatus = (step: string, completed: boolean, error?: string) => {
    setCreateStatus(prev => {
      const existing = prev.find(s => s.step === step);
      if (existing) {
        return prev.map(s => s.step === step ? { ...s, completed, error } : s);
      }
      return [...prev, { step, completed, error }];
    });
  };

  const handleCreatePR = useCallback(async () => {
    if (!repoUrl.trim() || !branchName.trim() || !prTitle.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    setError(null);
    setCreateStatus([]);
    setSuccessUrl(null);

    try {
      const instance = await getWebContainerInstance();
      if (!instance) {
        throw new Error("WebContainer instance is not available");
      }

      // Step 1: Create a new branch
      updateStatus("Creating new branch", false);
      
      const branchProcess = await instance.spawn("git", ["checkout", "-b", branchName]);
      const branchExitCode = await branchProcess.exit;
      
      if (branchExitCode !== 0) {
        updateStatus("Creating new branch", false, "Failed to create branch");
        setError("Failed to create new branch. Make sure you're in a git repository.");
        return;
      }
      
      updateStatus("Creating new branch", true);

      // Step 2: Add all changes
      updateStatus("Adding changes", false);
      
      const addProcess = await instance.spawn("git", ["add", "."]);
      const addExitCode = await addProcess.exit;
      
      if (addExitCode !== 0) {
        updateStatus("Adding changes", false, "Failed to add changes");
        setError("Failed to add changes to git.");
        return;
      }
      
      updateStatus("Adding changes", true);

      // Step 3: Commit changes
      updateStatus("Committing changes", false);
      
      const commitMessage = prTitle || "WebContainer changes";
      const commitProcess = await instance.spawn("git", ["commit", "-m", commitMessage]);
      const commitExitCode = await commitProcess.exit;
      
      if (commitExitCode !== 0) {
        updateStatus("Committing changes", false, "No changes to commit or commit failed");
        setError("No changes to commit or commit failed.");
        return;
      }
      
      updateStatus("Committing changes", true);

      // Step 4: Push to remote (if configured)
      updateStatus("Pushing to remote", false);
      
      try {
        const pushProcess = await instance.spawn("git", ["push", "origin", branchName]);
        const pushExitCode = await pushProcess.exit;
        
        if (pushExitCode === 0) {
          updateStatus("Pushing to remote", true);
          
          // Generate PR URL (this is a simplified version)
          const prUrl = `${repoUrl.replace('.git', '')}/compare/${branchName}`;
          setSuccessUrl(prUrl);
          
          setTimeout(() => {
            onSuccess?.();
            onOpenChange?.(false);
            // Reset form
            setRepoUrl("");
            setBranchName("");
            setPrTitle("");
            setPrDescription("");
            setCreateStatus([]);
          }, 2000);
        } else {
          updateStatus("Pushing to remote", false, "Failed to push to remote");
          setError("Failed to push to remote. You may need to configure git credentials.");
        }
      } catch (pushError) {
        updateStatus("Pushing to remote", false, "Failed to push to remote");
        setError("Failed to push to remote. You may need to configure git credentials.");
      }

    } catch (error) {
      console.error("Create PR error:", error);
      setError(`Failed to create PR: ${error}`);
    } finally {
      setIsCreating(false);
    }
  }, [repoUrl, branchName, prTitle, prDescription, onSuccess, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            Create Pull Request
          </DialogTitle>
          <DialogDescription>
            Create a pull request from your WebContainer changes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="repo-url">Repository URL *</Label>
            <Input
              id="repo-url"
              placeholder="https://github.com/username/repository"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="branch-name">Branch Name *</Label>
            <Input
              id="branch-name"
              placeholder="feature/my-new-feature"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pr-title">Pull Request Title *</Label>
            <Input
              id="pr-title"
              placeholder="Add new feature"
              value={prTitle}
              onChange={(e) => setPrTitle(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pr-description">Description (optional)</Label>
            <Textarea
              id="pr-description"
              placeholder="Describe your changes..."
              value={prDescription}
              onChange={(e) => setPrDescription(e.target.value)}
              disabled={isCreating}
              rows={4}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successUrl && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Changes pushed successfully! You can now{" "}
                <a 
                  href={successUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline"
                >
                  create a pull request on GitHub
                </a>
              </AlertDescription>
            </Alert>
          )}

          {createStatus.length > 0 && (
            <div className="space-y-2">
              {createStatus.map((status, index) => (
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
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreatePR}
            disabled={isCreating || !repoUrl.trim() || !branchName.trim() || !prTitle.trim()}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Create PR
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GitHubIntegration;