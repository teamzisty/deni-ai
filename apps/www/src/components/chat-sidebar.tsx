"use client";

import { useConversations } from "@/hooks/use-conversations";
import { useHubs, HubsProvider } from "@/hooks/use-hubs";
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
import {
  ArrowRight,
  BotIcon,
  FolderOpen,
  GripVertical,
  Headphones,
  Loader2,
  MessageCircle,
  Plus,
  Trash2,
} from "lucide-react";
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
import { Conversation } from "@/lib/conversations";
import { useSupabase } from "@/context/supabase-context";
import { Bot } from "@/lib/bot";
import { useBotsCache, BotsCacheProvider } from "@/hooks/use-bots-cache";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";

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

function DraggableConversation({
  conversation,
}: {
  conversation: Conversation;
}) {
  const { hubs } = useHubs();
  const params = useParams();
  const isActive = conversation.id === (params?.id as string | undefined);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: conversation.id,
      data: {
        type: "conversation",
        conversation,
      },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`${isDragging ? "opacity-50" : ""}`}
    >
      <ChatContextMenu conversationId={conversation.id}>
        <SidebarMenuItem>
          <div className="flex items-center w-full">
            <div
              {...listeners}
              className="flex items-center justify-center p-1 hover:bg-muted/50 rounded cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-3 w-3 text-muted-foreground" />
            </div>
            <SidebarMenuButton isActive={isActive} className="flex-1" asChild>
              <Link href={`/chat/${conversation.id}`}>
                <LoadingIndicator>
                  {conversation.bot ? (
                    <BotIcon />
                  ) : conversation.hub_id ? (
                    <FolderOpen />
                  ) : (
                    <MessageCircle />
                  )}
                </LoadingIndicator>
                {(() => {
                  const title = conversation.title || "Untitled Conversation";
                  const botName = conversation.bot?.name;
                  const hubId = conversation.hub_id;

                  // Find hub name if conversation belongs to a hub
                  const hub = hubId ? hubs.find((h) => h.id === hubId) : null;
                  const hubName = hub?.name;

                  let visualTitle = <>{title}</>;

                  if (hubName) {
                    // Show Hubs icon + Hub name > conversation icon + conversation name
                    visualTitle = (
                      <span className="flex items-center">
                        <span className="text-muted-foreground">{hubName}</span>
                        <ArrowRight className="inline mx-1 w-4 h-4" />
                        <MessageCircle className="inline mr-1 w-4 h-4" />
                        {title}
                      </span>
                    );
                  } else if (botName) {
                    visualTitle = (
                      <span className="flex items-center">
                        <span className="text-muted-foreground">{botName}</span>
                        <ArrowRight className="inline mx-1 w-4 h-4" />
                        {title}
                      </span>
                    );
                  }
                  return visualTitle;
                })()}
              </Link>
            </SidebarMenuButton>
          </div>
        </SidebarMenuItem>
      </ChatContextMenu>
    </div>
  );
}

export function SidebarConversation({
  conversation,
}: {
  conversation: Conversation;
}) {
  return <DraggableConversation conversation={conversation} />;
}

function DroppableHub({ hub }: { hub: { id: string; name: string } }) {
  const { isOver, setNodeRef } = useDroppable({
    id: hub.id,
    data: {
      type: "hub",
      hub,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`${isOver ? "bg-accent/50 rounded-md" : ""}`}
    >
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link href={`/hubs/${hub.id}`}>
            <FolderOpen className="h-4 w-4" />
            {hub.name}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </div>
  );
}

function ChatSidebarContent() {
  const { conversations, loading, createConversation } = useConversations();
  const {
    hubs,
    loading: hubsLoading,
    createHub,
    addConversationToHub,
  } = useHubs();
  const [isCreating, setIsCreating] = React.useState(false);
  const [isCreatingHub, setIsCreatingHub] = React.useState(false);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const params = useParams();
  const router = useRouter();
  const { pending } = useLinkStatus();
  const conversationId = params?.id as string | undefined;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Check if we're dropping a conversation onto a hub
    if (activeData?.type === "conversation" && overData?.type === "hub") {
      const conversation = activeData.conversation;
      const hub = overData.hub;

      try {
        const success = await addConversationToHub(hub.id, conversation.id);
        if (success) {
          toast.success(
            `Conversation "${conversation.title || "Untitled"}" added to hub "${hub.name}"`,
          );
        } else {
          toast.error("Failed to add conversation to hub");
        }
      } catch (error) {
        console.error("Error adding conversation to hub:", error);
        toast.error("Error adding conversation to hub");
      }
    }
  };

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

  const handleNewHub = async () => {
    if (isCreatingHub) return; // Prevent multiple clicks
    setIsCreatingHub(true);

    try {
      const hubName = `Hub ${hubs.length + 1}`;
      const hubDescription = "New hub";

      const hub = await createHub(hubName, hubDescription);
      if (!hub) {
        toast.error("Failed to create a new hub. Please try again.");
        return;
      }
      toast.success("New hub created successfully!");
      router.push(`/hubs/${hub.id}`);
    } catch (error) {
      toast.error("Failed to create a new hub. Please try again.");
    } finally {
      setIsCreatingHub(false);
    }
  };

  const activeConversation = activeId
    ? conversations.find((c) => c.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
                  <Button className="w-full" variant="outline" disabled>
                    <Headphones />
                    New Voice Chat
                  </Button>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <Button className="w-full" variant={"secondary"} asChild>
                    <Link href="/bots">
                      <BotIcon />
                      Bots
                    </Link>
                  </Button>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <Button className="w-full" variant={"secondary"} asChild>
                    <Link href="/hubs">
                      <FolderOpen />
                      Hubs
                    </Link>
                  </Button>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between">
              Hubs
              <Button
                size="sm"
                variant="ghost"
                onClick={handleNewHub}
                disabled={isCreatingHub}
                className="h-6 w-6 p-0"
              >
                {isCreatingHub ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
              </Button>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {hubsLoading && (
                  <div className="flex justify-center w-full py-2">
                    <Loader2 className="animate-spin" />
                  </div>
                )}
                {hubs.map((hub) => (
                  <DroppableHub key={hub.id} hub={hub} />
                ))}
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
                  <SidebarConversation
                    key={conversation.id}
                    conversation={conversation}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <DragOverlay>
        {activeConversation ? (
          <div className="bg-background border rounded-md p-2 shadow-lg">
            <div className="flex items-center gap-2">
              {activeConversation.bot ? (
                <BotIcon className="h-4 w-4" />
              ) : (
                <MessageCircle className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {activeConversation.title || "Untitled Conversation"}
              </span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export function ChatSidebar() {
  return (
    <BotsCacheProvider>
      <HubsProvider>
        <ChatSidebarContent />
      </HubsProvider>
    </BotsCacheProvider>
  );
}
