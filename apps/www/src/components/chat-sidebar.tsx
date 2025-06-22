"use client";

import { useConversations } from "@/hooks/use-conversations";
import { Button } from "@workspace/ui/components/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar";
import { Bot, Loader2, MessageCircle, Trash2 } from "lucide-react";
import Link, { useLinkStatus } from "next/link";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@workspace/ui/components/context-menu";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import React, { useEffect } from "react";
import Message from "./chat/message";
import LoadingIndicator from "./link-loading-indicator";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { Input } from "@workspace/ui/components/input";

export function ChatContextMenu({
  conversationId,
  children,
}: {
  conversationId: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const {
    conversations,
    deleteConversation,
    updateConversation,
    updateConversationTitle,
  } = useConversations();

  useEffect(() => {
    const conversation = conversations.find(
      (conv) => conv.id === conversationId,
    );
    if (conversation) {
      setNewName(conversation.title || "");
    } else {
      setNewName("");
    }
  }, []);

  const handleDeleteChat = async () => {
    try {
      const deleteConversationPromise = new Promise<boolean>(
        async (resolve, reject) => {
          const success = await deleteConversation(conversationId);
          if (success) {
            resolve(true);
          } else {
            reject(false);
          }
        },
      );
      toast.promise(deleteConversationPromise, {
        loading: "Deleting conversation...",
        success: () => {
          router.push("/chat");
          return "Conversation deleted successfully!";
        },
        error: () => "Failed to delete conversation. Please try again.",
      });
    } catch (error) {
      toast.error("Failed to delete conversation. Please try again.");
    }
  };

  const handleRenameChat = async () => {
    // Implement rename chat functionality
    if (!newName.trim()) {
      toast.error("Please enter a valid conversation name.");
      return;
    }

    toast.promise(updateConversation(conversationId, { title: newName }), {
      loading: "Renaming conversation...",
      success: () => "Conversation renamed successfully!",
      error: () => "Failed to rename conversation. Please try again.",
    });
    await updateConversationTitle(conversationId, newName);
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => setOpen(true)}>
            <MessageCircle /> Rename
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem variant={"destructive"} onClick={handleDeleteChat}>
            <Trash2 /> Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new name for the conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New conversation name"
          />
          <AlertDialogFooter>
            <Button variant={"outline"} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameChat}>Save</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function ChatSidebar() {
  const { conversations, loading, createConversation } = useConversations();
  const [isCreating, setIsCreating] = React.useState(false);
  const params = useParams();
  const router = useRouter();
  const { pending } = useLinkStatus();
  const conversationId = params?.id as string | undefined;

  const handleNewChat = async () => {
    if (isCreating) return; // Prevent multiple clicks
    setIsCreating(true);
    const conversation = await createConversation();
    if (!conversation) {
      toast.error("Failed to create a new conversation. Please try again.");
      return;
    }
    toast.success("New conversation created successfully!");
    // Redirect to the new conversation
    router.push(`/chat/${conversation.id}`);
    setIsCreating(false);
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="w-full flex justify-center my-2">
            <SidebarGroupLabel className="text-xl font-semibold text-foreground">
              Deni AI
            </SidebarGroupLabel>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Button
                  className="w-full"
                  onClick={handleNewChat}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <MessageCircle />
                  )}
                  New Chat
                </Button>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Button className="w-full" variant={"secondary"} asChild>
                  <Link href="/bots">
                    <Bot />
                    Bots
                  </Link>
                </Button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Conversations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {loading && (
                <div className="flex justify-center w-full py-2">
                  <Loader2 className="animate-spin" />
                </div>
              )}
              {conversations.map((conversation) => (
                <ChatContextMenu
                  conversationId={conversation.id}
                  key={conversation.id}
                >
                  <SidebarMenuItem key={conversation.id}>
                    <SidebarMenuButton
                      isActive={conversation.id === conversationId}
                      className="w-full"
                      asChild
                    >
                      <Link href={`/chat/${conversation.id}`}>
                        <LoadingIndicator>
                          <MessageCircle />
                        </LoadingIndicator>
                        {conversation.title || "Untitled Conversation"}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </ChatContextMenu>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
