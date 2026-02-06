"use client";

import { compareDesc, isThisMonth, isThisWeek, isThisYear, isToday, isYesterday } from "date-fns";
import { MoreHorizontal, Pencil, Share2, Trash2, Plus, MessageSquare } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useExtracted } from "next-intl";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
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
import { trpc } from "@/lib/trpc/react";
import { AccountMenu } from "@/components/account-menu";
import { ShareDialog } from "@/components/chat/share-dialog";
import DeniAIIcon from "@/components/deni-ai-icon";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

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

type ChatRecencyBucketKey = "today" | "yesterday" | "thisWeek" | "thisMonth" | "thisYear" | "older";

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

function groupChatsByRecency<T extends { updated_at: Date }>(items: T[]) {
  const bucketOrder: ChatRecencyBucketKey[] = [
    "today",
    "yesterday",
    "thisWeek",
    "thisMonth",
    "thisYear",
    "older",
  ];

  const buckets = new Map<ChatRecencyBucketKey, T[]>();
  const sorted = [...items].sort((a, b) => compareDesc(a.updated_at, b.updated_at));

  for (const item of sorted) {
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

function ChatItem({ item }: { item: { id: string; title: string | null } }) {
  const t = useExtracted();
  const pathname = usePathname();
  const router = useRouter();
  const utils = trpc.useUtils();
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(item.title ?? t("Untitled"));

  const deleteChat = trpc.chat.deleteChat.useMutation({
    onSuccess: async () => {
      await utils.chat.getChats.invalidate();
      if (pathname === `/chat/${item.id}`) {
        router.push("/app");
      }
    },
  });

  const renameChat = trpc.chat.updateChat.useMutation({
    onSuccess: async () => {
      await utils.chat.getChats.invalidate();
      setIsRenameOpen(false);
    },
  });

  const handleRename = () => {
    renameChat.mutate({ id: item.id, title: newTitle });
  };

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton isActive={pathname === `/chat/${item.id}`} asChild>
          <Link href={`/chat/${item.id}`}>
            <span>{item.title ?? t("Untitled")}</span>
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
            <DropdownMenuItem onClick={() => setIsRenameOpen(true)}>
              <Pencil className="size-4" />
              <span>{t("Rename")}</span>
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

      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Rename Chat")}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              aria-label={t("Chat title")}
              autoComplete="off"
              name="chat-title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRename();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button onClick={handleRename} disabled={renameChat.isPending}>
              {renameChat.isPending && <Spinner />}
              {t("Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ShareDialog chatId={item.id} isOpen={isShareOpen} onOpenChange={setIsShareOpen} />
    </>
  );
}

export function AppSidebar() {
  const t = useExtracted();
  const router = useRouter();
  const pathname = usePathname();
  const utils = trpc.useUtils();
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  const konamiIndexRef = useRef(0);
  const { isLoading, error, data } = trpc.chat.getChats.useQuery();
  const chatGroups = useMemo(() => groupChatsByRecency(data ?? []), [data]);
  const createConversion = trpc.chat.createChat.useMutation({
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
        router.push("/app");
      }
      toast.success(t("All conversations have been deleted."));
    },
    onError: (mutationError) => {
      console.error("Failed to delete all chats", mutationError);
      toast.error(t("Failed to delete conversations. Please try again."));
    },
  });

  useEffect(() => {
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
  }, [isDeleteAllDialogOpen]);

  const handleNewChat = () => {
    createConversion.mutate();
  };

  const handleDeleteAllChats = () => {
    if (deleteAllChats.isPending) {
      return;
    }
    deleteAllChats.mutate();
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
        {/* Header with logo and new chat */}
        <SidebarGroup>
          <div className="flex items-center justify-between mb-4">
            <Link href="/app" className="flex items-center gap-2">
              <DeniAIIcon className="w-7 h-7 text-sidebar-foreground" />
              <h1 className="text-base font-semibold tracking-tight text-sidebar-foreground">
                {t("Deni AI")}
              </h1>
            </Link>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Button
                  className="w-full justify-start gap-2 h-9 font-medium"
                  disabled={createConversion.isPending}
                  onClick={handleNewChat}
                >
                  {createConversion.isPending ? (
                    <Spinner className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {t("New Chat")}
                </Button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Spinner className="w-5 h-5 text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="px-3 py-4 text-sm text-destructive">
            {t("Error")}: {error.message}
          </div>
        ) : (
          <SidebarGroup className="flex-1 overflow-hidden">
            <SidebarGroupContent className="h-full overflow-y-auto">
              <SidebarMenu>
                {(data?.length ?? 0) === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3">
                      <MessageSquare className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("No chats yet")}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {t("Start a conversation to see it here")}
                    </p>
                  </div>
                )}
                {chatGroups.map((group) => (
                  <Fragment key={group.key}>
                    <SidebarMenuItem className="mt-4 first:mt-0">
                      <div className="px-2 pt-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
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
        )}

        <SidebarGroup className="w-full mt-auto pt-4 border-t border-sidebar-border">
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
    </Sidebar>
  );
}
