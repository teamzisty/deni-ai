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
  SidebarTrigger,
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
import { Link } from "@/i18n/navigation";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@workspace/ui/components/context-menu";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
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
} from "@workspace/ui/components/alert-dialog";
import { Input } from "@workspace/ui/components/input";
import { Conversation } from "@/lib/conversations";
import { BotsCacheProvider } from "@/hooks/use-bots-cache";
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
import { BRAND_NAME } from "@/lib/constants";
import { useSettings } from "@/hooks/use-settings";
import { cn } from "@workspace/ui/lib/utils";
import { useTranslations } from "@/hooks/use-translations";

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
  const t = useTranslations();

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
        loading: t("chat.sidebar.deleting"),
        success: () => {
          router.push("/chat");
          return t("chat.sidebar.deleteSuccess");
        },
        error: () => t("chat.sidebar.deleteFailed"),
      });
    } catch (error) {
      toast.error(t("chat.sidebar.deleteFailed"));
    }
  };

  const handleRenameChat = async () => {
    // Implement rename chat functionality
    if (!newName.trim()) {
      toast.error(t("chat.sidebar.invalidName"));
      return;
    }

    toast.promise(updateConversation(conversationId, { title: newName }), {
      loading: t("chat.sidebar.renaming"),
      success: () => t("chat.sidebar.renameSuccess"),
      error: () => t("chat.sidebar.renameFailed"),
    });
    await updateConversationTitle(conversationId, newName);
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => setOpen(true)}>
            <MessageCircle /> {t("chat.sidebar.rename")}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem variant={"destructive"} onClick={handleDeleteChat}>
            <Trash2 /> {t("chat.sidebar.delete")}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("chat.sidebar.renameTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("chat.sidebar.renameSubtitle")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t("chat.sidebar.renamePlaceholder")}
          />
          <AlertDialogFooter>
            <Button variant={"outline"} onClick={() => setOpen(false)}>
              {t("chat.sidebar.cancel")}
            </Button>
            <Button onClick={handleRenameChat}>{t("chat.sidebar.save")}</Button>
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
  const t = useTranslations();
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
                  ) : conversation.hubId ? (
                    <FolderOpen />
                  ) : (
                    <MessageCircle />
                  )}
                </LoadingIndicator>
                {(() => {
                  const title =
                    conversation.title ||
                    t("chat.sidebar.untitledConversation");
                  const botName = conversation.bot?.name;
                  const hubId = conversation.hubId;

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
  const { settings } = useSettings();
  const router = useRouter();
  const t = useTranslations();

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
            t("chat.sidebar.addedToHub", {
              title:
                conversation.title || t("chat.sidebar.untitledConversation"),
              hubName: hub.name,
            }),
          );
        } else {
          toast.error(t("chat.sidebar.addToHubFailed"));
        }
      } catch (error) {
        console.error("Error adding conversation to hub:", error);
        toast.error(t("chat.sidebar.addToHubError"));
      }
    }
  };

  const handleNewChat = async () => {
    if (isCreating) return; // Prevent multiple clicks
    setIsCreating(true);
    const conversation = await createConversation();
    if (!conversation) {
      toast.error(t("chat.sidebar.newChatFailed"));
      return;
    }
    toast.success(t("chat.sidebar.newChatSuccess"));
    // Redirect to the new conversation
    router.push(`/chat/${conversation.id}`);
    setIsCreating(false);
  };

  const handleNewHub = async () => {
    if (isCreatingHub) return; // Prevent multiple clicks
    setIsCreatingHub(true);

    try {
      const hubName = t("chat.sidebar.hubTitle", { number: hubs.length + 1 });
      const hubDescription = t("chat.sidebar.newHub");

      const hub = await createHub(hubName, hubDescription);
      if (!hub) {
        toast.error(t("chat.sidebar.newHubFailed"));
        return;
      }
      toast.success(t("chat.sidebar.newHubSuccess"));
      router.push(`/hubs/${hub.id}`);
    } catch (error) {
      toast.error(t("chat.sidebar.newHubFailed"));
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
              <SidebarGroupLabel className="text-xl font-semibold text-foreground underline-offset-3 hover:underline">
                <Link href="/chat">{BRAND_NAME}</Link>
              </SidebarGroupLabel>
              <SidebarTrigger className="top-4.5 right-3 absolute" />
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
                    {t("chat.sidebar.newChat")}
                  </Button>
                </SidebarMenuItem>

                {settings.bots && (
                  <SidebarMenuItem>
                    <Button className="w-full" variant={"secondary"} asChild>
                      <Link href="/bots">
                        <BotIcon />
                        {t("chat.sidebar.bots")}
                      </Link>
                    </Button>
                  </SidebarMenuItem>
                )}

                {settings.hubs && (
                  <SidebarMenuItem>
                    <Button className="w-full" variant={"secondary"} asChild>
                      <Link href="/hubs">
                        <FolderOpen />
                        {t("chat.sidebar.hubs")}
                      </Link>
                    </Button>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup className={cn({ hidden: !settings.hubs })}>
            <SidebarGroupLabel className="flex items-center justify-between">
              {t("chat.sidebar.hubs")}
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
            <SidebarGroupLabel>
              {t("chat.sidebar.conversations")}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {loading && (
                  <div className="flex justify-center w-full py-2">
                    <Loader2 className="animate-spin" />
                  </div>
                )}
                {conversations && conversations.map((conversation) => (
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
                {activeConversation.title ||
                  t("chat.sidebar.untitledConversation")}
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
