"use client";

import { UserButton } from "@daveyplate/better-auth-ui";
import {
  compareDesc,
  isThisMonth,
  isThisWeek,
  isThisYear,
  isToday,
  isYesterday,
} from "date-fns";
import {
  BookOpen,
  ChevronRight,
  HelpCircle,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Settings,
  Share2,
  Sparkles,
  Trash2,
  UserCircle2,
  UserIcon,
  Users,
} from "lucide-react";
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
  DropdownMenuSeparator,
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
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc/react";
import { ShareDialog } from "./chat/share-dialog";
import { Button } from "./ui/button";
import { Spinner } from "./ui/spinner";

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

type ChatRecencyBucketKey =
  | "today"
  | "yesterday"
  | "thisWeek"
  | "thisMonth"
  | "thisYear"
  | "older";

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
  const sorted = [...items].sort((a, b) =>
    compareDesc(a.updated_at, b.updated_at),
  );

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
              <Pencil className="mr-2 size-4" />
              <span>{t("Rename")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsShareOpen(true)}>
              <Share2 className="mr-2 size-4" />
              <span>{t("Share")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => deleteChat.mutate({ id: item.id })}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
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

      <ShareDialog
        chatId={item.id}
        isOpen={isShareOpen}
        onOpenChange={setIsShareOpen}
      />
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
  const session = authClient.useSession();
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
    <Sidebar>
      <SidebarContent className="px-3">
        <SidebarGroup>
          <h1 className="py-3 mx-auto text-2xl font-semibold tracking-tighter">
            {t("Deni AI")}
          </h1>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Button
                  className="w-full"
                  disabled={createConversion.isPending}
                  onClick={handleNewChat}
                >
                  {createConversion.isPending ? <Spinner /> : null}
                  {t("New Chat")}
                </Button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {isLoading ? (
          <Spinner className="mx-auto mt-3" />
        ) : error ? (
          <div>
            {t("Error")}: {error.message}
          </div>
        ) : (
          <SidebarGroup className="flex-1 overflow-hidden">
            <SidebarGroupContent className="h-full overflow-y-auto">
              <SidebarMenu>
                {(data?.length ?? 0) === 0 && (
                  <div className="text-sm text-center text-muted-foreground">
                    {t("No chats found.")}
                  </div>
                )}
                {chatGroups.map((group) => (
                  <Fragment key={group.key}>
                    <SidebarMenuItem className="mt-3 first:mt-0">
                      <div className="px-2 pt-2 text-xs font-medium text-muted-foreground">
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

        <SidebarGroup className="w-full mt-auto mb-4">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton className="h-auto py-2">
                      <div className="flex w-full items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground overflow-hidden">
                          {session.data?.user?.image ? (
                            <img
                              src={session.data.user.image}
                              alt={session.data.user.name ?? t("User")}
                              className="size-full object-cover"
                            />
                          ) : (
                            (session.data?.user?.name
                              ?.charAt(0)
                              .toUpperCase() ?? "U")
                          )}
                        </div>
                        <span className="flex-1 truncate text-sm">
                          {session.data?.user?.name ?? t("User")}
                        </span>
                      </div>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="right"
                    align="start"
                    className="w-56"
                  >
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <div className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground overflow-hidden text-xs">
                        {session.data?.user?.image ? (
                          <img
                            src={session.data.user.image}
                            alt={session.data.user.name ?? t("User")}
                            className="size-full object-cover"
                          />
                        ) : (
                          (session.data?.user?.name?.charAt(0).toUpperCase() ??
                          "U")
                        )}
                      </div>
                      <div className="flex-1 flex flex-col min-w-0">
                        <span className="flex-1 truncate text-sm font-medium">
                          {session.data?.user?.name ?? t("User")}
                        </span>
                        <span className="flex-1 truncate text-sm">
                          {session.data?.user?.email ?? t("User")}
                        </span>
                      </div>
                    </div>
                    <DropdownMenuItem className="gap-2 text-sm" asChild>
                      <Link href="/account/settings" className="flex w-full">
                        <UserIcon className="size-4" />
                        <span className="flex-1">{t("Account")}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 text-sm" asChild>
                      <Link href="/settings/appearance" className="flex w-full">
                        <Settings className="size-4" />
                        <span className="flex-1">{t("Settings")}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2 text-sm"
                      onClick={() => authClient.signOut()}
                    >
                      <LogOut className="size-4" />
                      <span>{t("Logout")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <AlertDialog
        open={isDeleteAllDialogOpen}
        onOpenChange={setIsDeleteAllDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("Delete all conversations with Deni AI?")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "This will permanently remove every chat in your history. This action cannot be undone.",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAllChats.isPending}>
              {t("Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteAllChats.isPending}
              onClick={handleDeleteAllChats}
            >
              {deleteAllChats.isPending ? <Spinner className="mr-2" /> : null}
              {t("Delete all chats")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}
