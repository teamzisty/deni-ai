"use client";

import { useEffect, useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { GitBranch, ChevronRight, MessageSquare } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { useSupabase } from "@/context/supabase-context";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  branchName?: string;
  parentSessionId?: string;
}

interface BranchTreeData {
  root: Conversation | null;
  branches: Conversation[];
}

interface BranchTreeProps {
  conversationId: string;
  currentConversationId?: string;
}

export function BranchTree({
  conversationId,
  currentConversationId,
}: BranchTreeProps) {
  const [branchTree, setBranchTree] = useState<BranchTreeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { secureFetch } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    const fetchBranchTree = async () => {
      if (!isLoading || isRequesting) return;
      setIsRequesting(true);
      try {
        const response = await secureFetch(
          `/api/conversations/branches?parentSessionId=${conversationId}&tree=true`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch branch tree");
        }

        const result = await response.json();
        if (result.success) {
          setBranchTree(result.data);
        }
      } catch (error) {
        console.error("Error fetching branch tree:", error);
      } finally {
        setIsRequesting(false);
        setIsLoading(false);
      }
    };

    fetchBranchTree();
  }, [conversationId]);

  const handleNavigateToBranch = (branchId: string) => {
    router.push(`/chat/${branchId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <GitBranch className="h-4 w-4 animate-pulse" />
        Loading branches...
      </div>
    );
  }

  if (!branchTree || branchTree.branches.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <ChevronRight
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""}`}
          />
          <GitBranch className="h-4 w-4" />
          {branchTree.branches.length}{" "}
          {branchTree.branches.length === 1 ? "branch" : "branches"}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-2">
        <div className="ml-6 border-l border-border pl-4 space-y-2">
          {/* Root conversation */}
          {branchTree.root && (
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <Button
                variant={
                  currentConversationId === branchTree.root.id
                    ? "secondary"
                    : "ghost"
                }
                size="sm"
                onClick={() => handleNavigateToBranch(branchTree.root!.id)}
                className="text-left justify-start flex-1"
              >
                {branchTree.root.title}
                {currentConversationId === branchTree.root.id && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (current)
                  </span>
                )}
              </Button>
            </div>
          )}

          {/* Branch conversations */}
          {branchTree.branches.map((branch) => (
            <div key={branch.id} className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-muted-foreground" />
              <Button
                variant={
                  currentConversationId === branch.id ? "secondary" : "ghost"
                }
                size="sm"
                onClick={() => handleNavigateToBranch(branch.id)}
                className="text-left justify-start flex-1"
              >
                <span className="font-medium">{branch.branchName}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {new Date(branch.created_at).toLocaleDateString()}
                </span>
                {currentConversationId === branch.id && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (current)
                  </span>
                )}
              </Button>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
