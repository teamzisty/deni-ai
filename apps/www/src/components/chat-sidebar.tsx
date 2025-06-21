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
import { Loader2, MessageCircle, Trash2 } from "lucide-react";
import Link, { useLinkStatus } from "next/link";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@workspace/ui/components/context-menu";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import React from "react";
import Message from "./chat/message";
import LoadingIndicator from "./link-loading-indicator";

export function ChatContextMenu({
  conversationId,
  children,
}: {
  conversationId: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const { deleteConversation } = useConversations();

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

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem variant={"destructive"} onClick={handleDeleteChat}>
          <Trash2 /> Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
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
