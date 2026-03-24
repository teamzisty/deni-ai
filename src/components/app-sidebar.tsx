"use client";

import type { CSSProperties } from "react";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { compareDesc, isThisMonth, isThisWeek, isThisYear, isToday, isYesterday } from "date-fns";
import {
  ChevronRight,
  FolderClosed,
  FolderOpen,
  ImageIcon,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Pin,
  Plus,
  Share2,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useExtracted } from "next-intl";
import { Fragment, startTransition, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { AccountMenu } from "@/components/account-menu";
import { ShareDialog } from "@/components/chat/share-dialog";
import DeniAIIcon from "@/components/deni-ai-icon";
import { isCheckoutSettingsRoute } from "@/lib/settings-routes";
import { trpc } from "@/lib/trpc/react";

const KONAMI_SEQUENCE = [
  "arrowup",
  "arrowup",
  "arrowdown",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "arrowleft",
  "arrowright",
  "b",
  "a",
] as const;

const SIDEBAR_CUSTOM_FOLDERS_KEY = "deni-ai.sidebar.custom-folders";
const DROP_ZONE_UNGROUPED = "__ungrouped__";

type ChatRecencyBucketKey = "today" | "yesterday" | "thisWeek" | "thisMonth" | "thisYear" | "older";

type ChatListItem = {
  id: string;
  title: string | null;
  pinned: boolean;
  folder: string | null;
  tags: string[];
  created_at: Date;
  updated_at: Date;
};

type ChatDragPayload = {
  chatId: string;
  folder: string | null;
};

type FolderGroup = {
  folder: string;
  items: ChatListItem[];
};

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const tags: string[] = [];

  for (const entry of value) {
    if (typeof entry !== "string") {
      continue;
    }

    const normalized = entry.trim();
    const key = normalized.toLowerCase();
    if (!normalized || seen.has(key)) {
      continue;
    }

    seen.add(key);
    tags.push(normalized);
  }

  return tags;
}

function parseTagsInput(value: string): string[] {
  return normalizeTags(value.split(","));
}

function getRecencyBucketKey(date: Date): ChatRecencyBucketKey {
  if (isToday(date)) {
    return "today";
  }
  if (isYesterday(date)) {
    return "yesterday";
  }
  if (isThisWeek(date, { weekStartsOn: 1 })) {
    return "thisWeek";
  }
  if (isThisMonth(date)) {
    return "thisMonth";
  }
  if (isThisYear(date)) {
    return "thisYear";
  }
  return "older";
}

function groupChatsByRecency(items: ChatListItem[]) {
  const bucketOrder: ChatRecencyBucketKey[] = [
    "today",
    "yesterday",
    "thisWeek",
    "thisMonth",
    "thisYear",
    "older",
  ];
  const buckets = new Map<ChatRecencyBucketKey, ChatListItem[]>();

  for (const item of items.toSorted((a, b) => compareDesc(a.updated_at, b.updated_at))) {
    const key = getRecencyBucketKey(item.updated_at);
    const existing = buckets.get(key);

    if (existing) {
      existing.push(item);
      continue;
    }

    buckets.set(key, [item]);
  }

  return bucketOrder.flatMap((key) => {
    const bucketItems = buckets.get(key);
    if (!bucketItems?.length) {
      return [];
    }

    return [{ key, items: bucketItems }] as const;
  });
}

function groupChatsByFolder(items: ChatListItem[]) {
  const folderMap = new Map<string, ChatListItem[]>();

  for (const item of items) {
    if (!item.folder) {
      continue;
    }

    const existing = folderMap.get(item.folder);
    if (existing) {
      existing.push(item);
      continue;
    }

    folderMap.set(item.folder, [item]);
  }

  return [...folderMap.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([folder, folderItems]) => ({
      folder,
      items: folderItems.toSorted((a, b) => compareDesc(a.updated_at, b.updated_at)),
    }));
}

function mergeFolderGroups(groups: FolderGroup[], customFolders: string[]) {
  const folderMap = new Map(groups.map((group) => [group.folder, group]));

  for (const folder of customFolders) {
    if (folderMap.has(folder)) {
      continue;
    }

    folderMap.set(folder, { folder, items: [] });
  }

  return [...folderMap.values()].sort((left, right) => left.folder.localeCompare(right.folder));
}

function getChatDragId(chatId: string) {
  return `chat:${chatId}`;
}

function getFolderDropId(folder: string) {
  return `folder:${folder}`;
}

function readFolderDropId(id: string | null) {
  if (!id) {
    return null;
  }

  if (id === DROP_ZONE_UNGROUPED) {
    return null;
  }

  return id.startsWith("folder:") ? id.slice("folder:".length) : null;
}

function ChatItem({ item }: { item: ChatListItem }) {
  const t = useExtracted();
  const pathname = usePathname();
  const router = useRouter();
  const utils = trpc.useUtils();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [title, setTitle] = useState(item.title ?? "");
  const [folder, setFolder] = useState(item.folder ?? "");
  const [tagsInput, setTagsInput] = useState(item.tags.join(", "));
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: getChatDragId(item.id),
    data: {
      chatId: item.id,
      folder: item.folder,
      type: "chat",
    } satisfies ChatDragPayload & { type: "chat" },
  });

  useEffect(() => {
    if (!isDetailsOpen) {
      setTitle(item.title ?? "");
      setFolder(item.folder ?? "");
      setTagsInput(item.tags.join(", "));
    }
  }, [isDetailsOpen, item.folder, item.tags, item.title]);

  const deleteChat = trpc.chat.deleteChat.useMutation({
    onSuccess: async () => {
      await utils.chat.getChats.invalidate();
      if (pathname === `/chat/${item.id}`) {
        router.push("/chat");
      }
    },
  });

  const updateChat = trpc.chat.updateChat.useMutation({
    onSuccess: async () => {
      await utils.chat.getChats.invalidate();
      setIsDetailsOpen(false);
    },
  });

  const handleSave = () => {
    const normalizedTitle = title.trim() || null;

    updateChat.mutate({
      id: item.id,
      title: normalizedTitle,
      folder: folder.trim() || null,
      tags: parseTagsInput(tagsInput),
    });
  };

  const handleTogglePin = () => {
    updateChat.mutate({
      id: item.id,
      pinned: !item.pinned,
    });
  };

  const dragStyle = transform
    ? ({
        transform: CSS.Translate.toString(transform),
      } satisfies CSSProperties)
    : undefined;

  return (
    <>
      <SidebarMenuItem
        ref={setNodeRef}
        className={isDragging ? "z-20 opacity-45" : ""}
        style={dragStyle}
      >
        <SidebarMenuButton
          {...attributes}
          {...listeners}
          className={
            item.tags.length > 0
              ? "cursor-grab py-6 active:cursor-grabbing"
              : "cursor-grab active:cursor-grabbing"
          }
          isActive={pathname === `/chat/${item.id}`}
          asChild
        >
          <Link href={`/chat/${item.id}`} className="flex min-w-0 items-center gap-2">
            <div className="min-w-0 flex-1">
              <div className="truncate leading-5">{item.title ?? t("Untitled")}</div>
              {item.tags.length > 0 ? (
                <div className="mt-1 flex items-center gap-1 overflow-hidden text-[11px] text-muted-foreground">
                  {item.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className="h-4 px-1.5 text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                  {item.tags.length > 2 ? <span>+{item.tags.length - 2}</span> : null}
                </div>
              ) : null}
            </div>
            {item.pinned ? <Pin className="size-3.5 shrink-0 text-muted-foreground" /> : null}
          </Link>
        </SidebarMenuButton>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuAction>
              <MoreHorizontal className="size-4" />
              <span className="sr-only">{t("More")}</span>
            </SidebarMenuAction>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start">
            <DropdownMenuItem onClick={() => setIsDetailsOpen(true)}>
              <Pencil className="size-4" />
              <span>{t("Edit details")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleTogglePin}>
              <Pin className="size-4" />
              <span>{item.pinned ? t("Unpin") : t("Pin")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsShareOpen(true)}>
              <Share2 className="size-4" />
              <span>{t("Share")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => deleteChat.mutate({ id: item.id })}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="size-4" />
              <span>{t("Delete")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Chat Details")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <div className="text-sm font-medium">{t("Title")}</div>
              <Input
                aria-label={t("Chat title")}
                autoComplete="off"
                name="chat-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">{t("Folder")}</div>
              <Input
                aria-label={t("Folder")}
                autoComplete="off"
                name="chat-folder"
                placeholder={t("e.g. Work")}
                value={folder}
                onChange={(event) => setFolder(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">{t("Tags")}</div>
              <Input
                aria-label={t("Tags")}
                autoComplete="off"
                name="chat-tags"
                placeholder={t("Comma-separated tags")}
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
              />
            </div>
            <Button
              type="button"
              variant={item.pinned ? "default" : "outline"}
              className="w-full justify-center gap-2"
              onClick={handleTogglePin}
              disabled={updateChat.isPending}
            >
              <Pin className="size-4" />
              {item.pinned ? t("Pinned") : t("Pin this chat")}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button onClick={handleSave} disabled={updateChat.isPending}>
              {updateChat.isPending ? <Spinner /> : null}
              {t("Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ShareDialog chatId={item.id} isOpen={isShareOpen} onOpenChange={setIsShareOpen} />
    </>
  );
}

function FolderDropItem({
  activeChatId,
  expanded,
  folder,
  onToggle,
}: {
  activeChatId: string | null;
  expanded: boolean;
  folder: FolderGroup;
  onToggle: () => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: getFolderDropId(folder.folder),
  });
  const isActive = folder.items.some((item) => item.id === activeChatId);

  return (
    <SidebarMenuItem>
      <button
        ref={setNodeRef}
        className={[
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/88",
          isOver
            ? "bg-sidebar-primary/12 ring-1 ring-sidebar-primary/30"
            : "hover:bg-sidebar-accent/70",
        ].join(" ")}
        onClick={onToggle}
        type="button"
      >
        <ChevronRight
          className={[
            "size-3.5 shrink-0 text-muted-foreground transition-transform",
            expanded ? "rotate-90" : "",
          ].join(" ")}
        />
        {expanded ? (
          <FolderOpen className="size-4 shrink-0 text-sidebar-primary" />
        ) : (
          <FolderClosed className="size-4 shrink-0 text-sidebar-primary" />
        )}
        <span className="min-w-0 flex-1 truncate">{folder.folder}</span>
        <span className="rounded-full bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {folder.items.length}
        </span>
      </button>
    </SidebarMenuItem>
  );
}

function FolderSection({
  activeChatId,
  folderGroups,
  onRequestCreateFolder,
}: {
  activeChatId: string | null;
  folderGroups: FolderGroup[];
  onRequestCreateFolder: () => void;
}) {
  const t = useExtracted();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!activeChatId) {
      return;
    }

    const activeFolder = folderGroups.find((group) =>
      group.items.some((item) => item.id === activeChatId),
    );
    if (!activeFolder) {
      return;
    }

    startTransition(() => {
      setExpandedFolders((current) => {
        if (current.has(activeFolder.folder)) {
          return current;
        }

        const next = new Set(current);
        next.add(activeFolder.folder);
        return next;
      });
    });
  }, [activeChatId, folderGroups]);

  const toggleFolder = (folder: string) => {
    startTransition(() => {
      setExpandedFolders((current) => {
        const next = new Set(current);
        if (next.has(folder)) {
          next.delete(folder);
        } else {
          next.add(folder);
        }
        return next;
      });
    });
  };

  return (
    <Fragment>
      <SidebarMenuItem className="mt-4 first:mt-0">
        <div className="flex items-center justify-between gap-2 px-2 pb-2 pt-2">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {t("Folders")}
          </div>
          <Button
            className="h-6"
            onClick={onRequestCreateFolder}
            size="icon-xs"
            type="button"
            variant="ghost"
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
      </SidebarMenuItem>
      {folderGroups.length === 0 ? (
        <SidebarMenuItem>
          <div className="px-2 py-2 text-xs text-muted-foreground">{t("No folders yet")}</div>
        </SidebarMenuItem>
      ) : null}
      {folderGroups.map((group) => {
        const expanded = expandedFolders.has(group.folder);

        return (
          <Fragment key={group.folder}>
            <FolderDropItem
              activeChatId={activeChatId}
              expanded={expanded}
              folder={group}
              onToggle={() => toggleFolder(group.folder)}
            />
            {expanded ? (
              <div className="relative ml-4 space-y-1 border-l border-sidebar-border/80 pl-2">
                {group.items.map((item) => (
                  <ChatItem key={item.id} item={item} />
                ))}
              </div>
            ) : null}
          </Fragment>
        );
      })}
    </Fragment>
  );
}

function RemoveFromFolderDropZone({ visible }: { visible: boolean }) {
  const t = useExtracted();
  const { isOver, setNodeRef } = useDroppable({
    id: DROP_ZONE_UNGROUPED,
  });

  if (!visible) {
    return null;
  }

  return (
    <SidebarMenuItem className="mt-3">
      <button
        ref={setNodeRef}
        className={[
          "flex w-full items-center gap-2 rounded-md border border-dashed px-2 py-2 text-left text-xs transition-colors",
          isOver
            ? "border-sidebar-primary/50 bg-sidebar-primary/10 text-sidebar-foreground"
            : "border-sidebar-border/80 text-muted-foreground hover:border-sidebar-primary/30 hover:bg-sidebar-accent/60",
        ].join(" ")}
        type="button"
      >
        <FolderClosed className="size-3.5 shrink-0" />
        <span>{t("Drop here to remove from folder")}</span>
      </button>
    </SidebarMenuItem>
  );
}

export function AppSidebar({
  onOpenChatSearch,
  onNewChatRef,
}: {
  onOpenChatSearch: () => void;
  onNewChatRef?: React.RefObject<(() => void) | null>;
}) {
  const t = useExtracted();
  const router = useRouter();
  const pathname = usePathname();
  const isCheckoutRoute = isCheckoutSettingsRoute(pathname);
  const utils = trpc.useUtils();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
  );
  const [activeDragChat, setActiveDragChat] = useState<ChatDragPayload | null>(null);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const konamiIndexRef = useRef(0);
  const { isLoading, error, data } = trpc.chat.getChats.useQuery();

  const chats = useMemo<ChatListItem[]>(
    () =>
      (data ?? []).map((item) => ({
        ...item,
        pinned: Boolean(item.pinned),
        folder: item.folder?.trim() || null,
        tags: normalizeTags(item.tags),
      })),
    [data],
  );

  const pinnedChats = useMemo(
    () =>
      chats
        .filter((item) => item.pinned)
        .toSorted((a, b) => compareDesc(a.updated_at, b.updated_at)),
    [chats],
  );
  const folderChats = useMemo(() => chats.filter((item) => !item.pinned && item.folder), [chats]);
  const ungroupedChats = useMemo(
    () => chats.filter((item) => !item.pinned && !item.folder),
    [chats],
  );
  const folderGroups = useMemo(
    () => mergeFolderGroups(groupChatsByFolder(folderChats), customFolders),
    [customFolders, folderChats],
  );
  const recencyGroups = useMemo(() => groupChatsByRecency(ungroupedChats), [ungroupedChats]);
  const activeChatId = pathname?.startsWith("/chat/") ? pathname.slice("/chat/".length) : null;

  useEffect(() => {
    const storedFolders = window.localStorage.getItem(SIDEBAR_CUSTOM_FOLDERS_KEY);
    if (!storedFolders) {
      return;
    }

    try {
      const parsed = JSON.parse(storedFolders);
      if (!Array.isArray(parsed)) {
        return;
      }

      setCustomFolders(
        parsed
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.trim())
          .filter(Boolean),
      );
    } catch {
      window.localStorage.removeItem(SIDEBAR_CUSTOM_FOLDERS_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_CUSTOM_FOLDERS_KEY, JSON.stringify(customFolders));
  }, [customFolders]);

  const moveChatToFolder = trpc.chat.updateChat.useMutation({
    onSuccess: async () => {
      await utils.chat.getChats.invalidate();
      setActiveDragChat(null);
    },
    onError: () => {
      setActiveDragChat(null);
      toast.error(t("Failed to move chat. Please try again."));
    },
  });

  const createConversation = trpc.chat.createChat.useMutation({
    onSuccess: async (res) => {
      await utils.chat.getChats.invalidate();
      if (res) {
        router.push(`/chat/${res}`);
      }
    },
  });

  const deleteAllChats = trpc.chat.deleteAllChats.useMutation({
    onSuccess: async () => {
      await utils.chat.getChats.invalidate();
      setIsDeleteAllDialogOpen(false);
      if (pathname?.startsWith("/chat/")) {
        router.push("/chat");
      }
      toast.success(t("All conversations have been deleted."));
    },
    onError: (mutationError) => {
      console.error("Failed to delete all chats", mutationError);
      toast.error(t("Failed to delete conversations. Please try again."));
    },
  });

  useEffect(() => {
    if (isCheckoutRoute) {
      konamiIndexRef.current = 0;
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isDeleteAllDialogOpen) {
        return;
      }

      const key = event.key.toLowerCase();
      const expectedKey = KONAMI_SEQUENCE[konamiIndexRef.current];

      if (key === expectedKey) {
        konamiIndexRef.current += 1;
        if (konamiIndexRef.current === KONAMI_SEQUENCE.length) {
          konamiIndexRef.current = 0;
          setIsDeleteAllDialogOpen(true);
        }
        return;
      }

      konamiIndexRef.current = key === KONAMI_SEQUENCE[0] ? 1 : 0;
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCheckoutRoute, isDeleteAllDialogOpen]);

  const handleNewChat = () => {
    createConversation.mutate();
  };

  useEffect(() => {
    if (!onNewChatRef) {
      return;
    }

    (onNewChatRef as React.MutableRefObject<(() => void) | null>).current = handleNewChat;
    return () => {
      (onNewChatRef as React.MutableRefObject<(() => void) | null>).current = null;
    };
  }, [handleNewChat, onNewChatRef]);

  if (isCheckoutRoute) {
    return null;
  }

  const handleDeleteAllChats = () => {
    if (deleteAllChats.isPending) {
      return;
    }

    deleteAllChats.mutate();
  };

  const handleCreateFolder = () => {
    const normalizedFolder = newFolderName.trim();
    if (!normalizedFolder) {
      return;
    }

    setCustomFolders((current) => {
      if (
        current.some((folder) => folder.toLowerCase() === normalizedFolder.toLowerCase()) ||
        folderGroups.some((group) => group.folder.toLowerCase() === normalizedFolder.toLowerCase())
      ) {
        return current;
      }

      return [...current, normalizedFolder];
    });
    setNewFolderName("");
    setIsCreateFolderOpen(false);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const payload = event.active.data.current;
    if (!payload || payload.type !== "chat") {
      return;
    }

    setActiveDragChat({
      chatId: payload.chatId,
      folder: payload.folder,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const payload = event.active.data.current;
    const dragPayload =
      payload && payload.type === "chat" ? (payload as ChatDragPayload & { type: "chat" }) : null;
    const chatId = dragPayload?.chatId ?? null;
    const nextFolder = readFolderDropId(event.over?.id?.toString() ?? null);

    if (!chatId || !dragPayload || !event.over) {
      setActiveDragChat(null);
      return;
    }

    if (dragPayload.folder === nextFolder) {
      setActiveDragChat(null);
      return;
    }

    moveChatToFolder.mutate({
      id: chatId,
      folder: nextFolder,
    });
  };

  const getRecencyLabel = (key: ChatRecencyBucketKey) => {
    switch (key) {
      case "today":
        return t("Today");
      case "yesterday":
        return t("Yesterday");
      case "thisWeek":
        return t("This week");
      case "thisMonth":
        return t("This month");
      case "thisYear":
        return t("This year");
      case "older":
        return t("Older");
      default:
        return key;
    }
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <div className="mb-4 flex items-center justify-between">
            <Link href="/chat" className="flex items-center gap-2">
              <DeniAIIcon className="h-7 w-7 text-sidebar-foreground" />
              <h1 className="text-base font-semibold tracking-tight text-sidebar-foreground">
                {t("Deni AI")}
              </h1>
            </Link>
          </div>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0">
              <SidebarMenuItem>
                <Button
                  className="group/newchat h-9 w-full justify-start gap-2 rounded-b-none font-medium"
                  disabled={createConversation.isPending}
                  onClick={handleNewChat}
                >
                  {createConversation.isPending ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {t("New Chat")}
                  <Kbd className="ml-auto opacity-0 transition-opacity duration-150 group-hover/newchat:opacity-100 bg-sidebar text-sidebar-foreground/80">
                    Ctrl+N
                  </Kbd>
                </Button>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Button
                  className="group/search h-9 w-full justify-start gap-2 rounded-none font-medium"
                  onClick={onOpenChatSearch}
                  variant="outline"
                >
                  <MessageSquare className="size-4" />
                  <span>{t("Chat Search")}</span>
                  <Kbd className="ml-auto opacity-0 transition-opacity duration-150 group-hover/search:opacity-100 bg-sidebar text-sidebar-foreground/80">
                    Ctrl+K
                  </Kbd>
                </Button>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Button
                  className="h-9 w-full justify-start gap-2 rounded-none font-medium"
                  asChild
                  variant="outline"
                >
                  <Link href="/palette">
                    <ImageIcon className="size-4" />
                    <span>{t("Palette")}</span>
                  </Link>
                </Button>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Button
                  className="h-9 w-full justify-start gap-2 rounded-t-none font-medium"
                  asChild
                  variant="outline"
                >
                  <Link href="/settings/projects">
                    <FolderClosed className="size-4" />
                    <span>{t("Projects")}</span>
                  </Link>
                </Button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Spinner className="h-5 w-5 text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="px-3 py-4 text-sm text-destructive">
            {t("Error")}: {error.message}
          </div>
        ) : (
          <DndContext
            collisionDetection={closestCenter}
            onDragCancel={() => setActiveDragChat(null)}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
            sensors={sensors}
          >
            <SidebarGroup className="flex-1 overflow-hidden">
              <SidebarGroupContent className="h-full overflow-y-auto">
                <SidebarMenu>
                  {chats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                        <MessageSquare className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">{t("No chats yet")}</p>
                      <p className="mt-1 text-xs text-muted-foreground/70">
                        {t("Start a conversation to see it here")}
                      </p>
                    </div>
                  ) : null}

                  {pinnedChats.length > 0 ? (
                    <Fragment>
                      <SidebarMenuItem className="mt-4 first:mt-0">
                        <div className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          {t("Pinned")}
                        </div>
                      </SidebarMenuItem>
                      {pinnedChats.map((item) => (
                        <ChatItem key={item.id} item={item} />
                      ))}
                    </Fragment>
                  ) : null}

                  <FolderSection
                    activeChatId={activeChatId}
                    folderGroups={folderGroups}
                    onRequestCreateFolder={() => setIsCreateFolderOpen(true)}
                  />

                  <RemoveFromFolderDropZone visible={activeDragChat !== null} />

                  {recencyGroups.map((group) => (
                    <Fragment key={group.key}>
                      <SidebarMenuItem className="mt-4 first:mt-0">
                        <div className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          {getRecencyLabel(group.key)}
                        </div>
                      </SidebarMenuItem>
                      {group.items.map((item) => (
                        <ChatItem key={item.id} item={item} />
                      ))}
                    </Fragment>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </DndContext>
        )}

        <SidebarGroup className="mt-auto w-full border-t border-sidebar-border pt-4">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <AccountMenu />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <AlertDialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete all conversations with Deni AI?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "This will permanently remove every chat in your history. This action cannot be undone.",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAllChats.isPending}>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteAllChats.isPending}
              onClick={handleDeleteAllChats}
            >
              {deleteAllChats.isPending ? <Spinner /> : null}
              {t("Delete all chats")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("New Folder")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <div className="text-sm font-medium">{t("Folder name")}</div>
            <Input
              aria-label={t("Folder name")}
              autoComplete="off"
              name="new-folder-name"
              placeholder={t("e.g. Work")}
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleCreateFolder();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button onClick={handleCreateFolder}>{t("Create")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
