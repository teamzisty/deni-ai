"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
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
import { ChatSession, useChatSessions } from "@/hooks/use-chat-sessions";
import { toast } from "sonner";

interface CreateBranchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSession: ChatSession;
}

export function CreateBranchModal({
  open,
  onOpenChange,
  currentSession,
}: CreateBranchModalProps) {
  const t = useTranslations();
  const { createBranchSession } = useChatSessions();
  const [branchName, setBranchName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateBranch = useCallback(async () => {
    if (!branchName.trim()) {
      toast.error(t("createBranchModal.error.nameRequired"));
      return;
    }
    setIsLoading(true);
    try {
      await createBranchSession(currentSession, branchName.trim());
      // toast.success(t('createBranchModal.success.branchCreated', { branchName })); // Already in useChatSessions
      setBranchName("");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create branch:", error);
      toast.error(t("createBranchModal.error.creationFailed"));
    }
    setIsLoading(false);
  }, [branchName, currentSession, createBranchSession, onOpenChange, t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("createBranchModal.title")}</DialogTitle>
          <DialogDescription>
            {t("createBranchModal.description", {
              parentTitle: currentSession.title || "Session",
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="branch-name" className="text-right">
              {t("createBranchModal.label.branchName")}
            </Label>
            <Input
              id="branch-name"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              className="col-span-3"
              placeholder={t("createBranchModal.placeholder.branchName")}
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            onClick={handleCreateBranch}
            disabled={isLoading || !branchName.trim()}
          >
            {isLoading ? t("common.creating") : t("common.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
