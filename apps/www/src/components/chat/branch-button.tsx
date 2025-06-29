"use client";

import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { GitBranch, Loader2 } from "lucide-react";
import { BranchDialog } from "./branch-dialog";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/context/supabase-context";

interface BranchButtonProps {
  conversationId: string;
  messageIndex?: number;
}

export function BranchButton({ conversationId, messageIndex }: BranchButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { secureFetch } = useSupabase();
  const router = useRouter();

  const handleCreateBranch = async (branchName: string, includeMessages: boolean) => {
    setIsCreating(true);
    
    try {
      const response = await secureFetch("/api/conversations/branches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parentSessionId: conversationId,
          branchName,
          includeMessages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create branch");
      }

      const result = await response.json();
      
      if (result.success) {
        // Navigate to the new branch
        router.push(`/chat/${result.data.id}`);
      } else {
        throw new Error(result.error || "Failed to create branch");
      }
    } catch (error) {
      console.error("Error creating branch:", error);
      // You might want to show a toast notification here
    } finally {
      setIsCreating(false);
      setIsDialogOpen(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsDialogOpen(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        disabled={isCreating}
      >
        {isCreating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <GitBranch className="h-4 w-4" />
        )}
        Branch
      </Button>
      
      <BranchDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onCreateBranch={handleCreateBranch}
        isCreating={isCreating}
      />
    </>
  );
}