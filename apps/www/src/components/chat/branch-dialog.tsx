"use client";

import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { GitBranch } from "lucide-react";

interface BranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateBranch: (branchName: string, includeMessages: boolean) => void;
  isCreating?: boolean;
}

export function BranchDialog({
  open,
  onOpenChange,
  onCreateBranch,
  isCreating = false,
}: BranchDialogProps) {
  const [branchName, setBranchName] = useState("");
  const [includeMessages, setIncludeMessages] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (branchName.trim()) {
      onCreateBranch(branchName.trim(), includeMessages);
      setBranchName("");
      setIncludeMessages(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Create New Branch
          </DialogTitle>
          <DialogDescription>
            Create a new conversation branch to explore different directions
            from this point.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="branch-name" className="text-right">
                Name
              </Label>
              <Input
                id="branch-name"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="Enter branch name"
                className="col-span-3"
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-messages"
                checked={includeMessages}
                onCheckedChange={(checked) => 
                  setIncludeMessages(checked as boolean)
                }
              />
              <Label htmlFor="include-messages" className="text-sm">
                Include existing messages in the new branch
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!branchName.trim() || isCreating}>
              {isCreating ? "Creating..." : "Create Branch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}