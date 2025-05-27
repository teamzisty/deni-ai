"use client";

import { ChatSession, useChatSessions } from "@/hooks/use-chat-sessions";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar";
import {
  Code2,
  MessageCircleMore,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  GitFork,
  ArrowRight,
  LayoutGrid,
  FolderDotIcon,
  BotMessageSquare,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@workspace/ui/components/badge";
import { useParams } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@workspace/ui/components/drawer";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@workspace/ui/components/button";
import { toast } from "sonner";
import { useEffect, useState, useMemo, useCallback, memo, useRef } from "react";
import { AccountDropdownMenu } from "./AccountDropdownMenu";
import { ChatContextMenu } from "./context-menu";
import { buildInfo } from "@/lib/version";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@workspace/ui/components/input";
import LoadingIndicator from "./LoadingIndicator";
import { HubSidebar } from "./hub-sidebar";
import { useHubs } from "@/hooks/use-hubs";
import { useSettings } from "@/hooks/use-settings";
import { cn } from "@workspace/ui/lib/utils";

interface GroupedSessions {
  today: ChatSession[];
  yesterday: ChatSession[];
  thisWeek: ChatSession[];
  thisMonth: ChatSession[];
  older: ChatSession[];
}

function groupSessionsByDate(sessions: ChatSession[]): GroupedSessions {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return {
    today: sessions
      .filter((session) => new Date(session.createdAt) > oneDayAgo)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    yesterday: sessions
      .filter((session) => {
        const date = new Date(session.createdAt);
        return date <= oneDayAgo && date > twoDaysAgo;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    thisWeek: sessions
      .filter((session) => {
        const date = new Date(session.createdAt);
        return date <= twoDaysAgo && date > oneWeekAgo;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    thisMonth: sessions
      .filter((session) => {
        const date = new Date(session.createdAt);
        return date <= oneWeekAgo && date > oneMonthAgo;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    older: sessions
      .filter((session) => new Date(session.createdAt) <= oneMonthAgo)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
  };
}

function SessionGroup({
  sessions,
  label,
  currentSessionId,
}: {
  sessions: ChatSession[];
  label: string;
  currentSessionId?: string;
}) {
  if (sessions.length === 0) return null;
  const t = useTranslations();
  const { settings } = useSettings();
  const { getHub } = useHubs();

  // Setup drag and drop handlers for chat sessions
  const handleDragStart = (
    e: React.DragEvent,
    sessionId: string,
    sessionTitle: string
  ) => {
    e.dataTransfer.setData("text/plain", sessionId);
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        id: sessionId,
        title: sessionTitle,
      })
    );
    e.dataTransfer.effectAllowed = "move";

    // Add a class to the dragging element for styling
    const target = e.currentTarget as HTMLElement;
    target.classList.add("opacity-50");
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Remove styling class when drag ends
    const target = e.currentTarget as HTMLElement;
    target.classList.remove("opacity-50");
  };

  return (
    <SidebarGroup className="pt-1">
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu suppressHydrationWarning>
          {sessions.slice().map((session) => {
            const hub = session.hubId ? getHub(session.hubId) : undefined;
            const bot = session.bot || undefined;
            const isBranch = session.isBranch && session.branchName;
            const isHub = session.hubId && hub;
            const isBot = session.bot;

            return (
              <SidebarMenuItem
                key={session.id}
                draggable
                onDragStart={(e) =>
                  handleDragStart(e, session.id, session.title)
                }
                onDragEnd={handleDragEnd}
                className="chat-session-item cursor-grab active:cursor-grabbing"
                data-chat-id={session.id}
              >
                <ChatContextMenu session={session}>
                  <SidebarMenuButton
                    className="flex"
                    isActive={currentSessionId === session.id}
                    asChild
                    forceShowTooltip={settings.conversationsPrivacyMode}
                    tooltip={
                      isBranch
                        ? `${t("sidebar.branchTooltipPrefix", {
                            parentTitle:
                              sessions.find(
                                (s) => s.id === session.parentSessionId
                              )?.title || "Unknown Parent",
                          })}: ${session.branchName}`
                        : session.title
                    }
                  >
                    <Link
                      href={`/chat/${session.id}`}
                      className={`flex items-center`}
                    >
                      {isHub ? ( // hub only or hub and branch
                        <FolderDotIcon className="h-4 w-4 text-primary" />
                      ) : isBranch ? ( // branch only
                        <GitFork className="h-4 w-4 text-primary" />
                      ) : isBot ? ( // bot only
                        <BotMessageSquare className="h-4 w-4 text-primary" />
                      ) : ( // default
                        <MessageCircleMore className="mr-2 h-4 w-4" />
                      )}
                      <div className="flex items-center w-full min-w-0">
                        {" "}
                        {session.hubId && hub && (
                          <div className="flex items-center gap-1 mr-1">
                            <span
                              className={cn(
                                "text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis",
                                settings.conversationsPrivacyMode && "blur-sm"
                              )}
                            >
                              {hub?.name}
                            </span>
                            <ArrowRight size={12} />
                            {isBranch ? (
                              <GitFork className="h-4 w-4 text-primary" />
                            ): isBot ? (
                              <BotMessageSquare className="h-4 w-4 text-primary" />
                            ) : (
                              <MessageCircleMore className="h-4 w-4" />
                            )}{" "}
                          </div>
                        )}
                        {isBot && (
                          <div className="flex items-center gap-1 mr-1">
                            <span className="text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                              {bot?.name}
                            </span>
                            <ArrowRight size={12} />
                            {session.isBranch && session.branchName ? (
                              <GitFork className="h-4 w-4 text-primary" />
                            ) : (
                              <MessageCircleMore className="h-4 w-4" />
                            )}{" "}
                          </div>
                        )}
                        {isBranch && (
                          <div className="flex items-center gap-1 mr-1">
                            <span
                              className={cn(
                                "text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis",
                                settings.conversationsPrivacyMode && "blur-sm"
                              )}
                            >
                              {session.branchName}
                            </span>
                            <ArrowRight size={12} />
                            <MessageCircleMore className="h-4 w-4" />
                          </div>
                        )}
                        <p
                          className={cn(
                            "truncate min-w-0",
                            settings.conversationsPrivacyMode && "blur-sm"
                          )}
                        >
                          {session.title}
                        </p>
                      </div>
                      <LoadingIndicator className="ml-auto" />
                    </Link>
                  </SidebarMenuButton>
                </ChatContextMenu>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

// debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// メモ化された新しい検索バーコンポーネント
const SearchBar = memo(
  ({ onSearch }: { onSearch: (query: string) => void }) => {
    const [inputValue, setInputValue] = useState("");
    const t = useTranslations();

    // 入力値をdebounceする
    const debouncedValue = useDebounce(inputValue, 300);

    // debouncedValueが変わったときだけonSearchを呼び出す
    useEffect(() => {
      onSearch(debouncedValue);
    }, [debouncedValue, onSearch]);

    // 入力値の変更を即時反映（UIの反応は即時）
    const handleSearchChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
      },
      []
    );

    return (
      <SidebarMenuItem>
        <div className="relative mt-3">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t("sidebar.searchChats")}
            className="pl-8"
            value={inputValue}
            onChange={handleSearchChange}
          />
        </div>
      </SidebarMenuItem>
    );
  }
);

SearchBar.displayName = "SearchBar";

// メモ化されたセッショングループコンポーネント
const MemoizedSessionGroup = memo(SessionGroup);

function ChatSidebarMenuSession() {
  const { sessions, createSession } = useChatSessions();
  const params = useParams<{ id: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const { settings } = useSettings();
  const t = useTranslations();

  // 検索条件でセッションをフィルタリング（useMemoで最適化）
  const filteredSessions = useMemo(() => {
    if (searchQuery.trim() === "") {
      return sessions;
    }
    return sessions.filter((session) =>
      session.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, sessions]);

  // グループ化も最適化
  const groupedSessions = useMemo(
    () => groupSessionsByDate(filteredSessions),
    [filteredSessions]
  );

  // 検索処理はコールバックで最適化
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleCreateSession = useCallback(() => {
    createSession();
  }, [createSession]);

  return (
    <>
      <SidebarGroup className="pb-0">
        <SidebarGroupContent>
          <SidebarMenu suppressHydrationWarning>
            <SidebarMenuItem>
              <SidebarMenuButton
                variant={"outline"}
                size="lg"
                className="flex items-center justify-center transition-all duration-200 ease-in-out"
                onClick={handleCreateSession}
                tooltip={t("sidebar.newChat")}
                data-sidebar="menu-button"
                data-size="lg"
              >
                <Plus />
                <span className="group-data-[collapsible=icon]:hidden">
                  {t("sidebar.newChat")}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {settings.bots && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  variant={"default"} // Changed from "ghost" to "default"
                  size="lg"
                  className="flex items-center justify-center transition-all duration-200 ease-in-out"
                  asChild
                  tooltip={t("sidebar.bots")}
                  data-sidebar="menu-button"
                  data-size="lg"
                >
                  <Link href="/bots" className="flex items-center">
                    <BotMessageSquare />
                    <span className="group-data-[collapsible=icon]:hidden ml-2">
                      {t("sidebar.bots")}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

            <SearchBar onSearch={handleSearch} />
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <HubSidebar /> {/* Moved HubSidebar here */}

      <MemoizedSessionGroup
        sessions={groupedSessions.today}
        label={t("sidebar.today")}
        currentSessionId={params.id}
      />
      <MemoizedSessionGroup
        sessions={groupedSessions.yesterday}
        label={t("sidebar.yesterday")}
        currentSessionId={params.id}
      />
      <MemoizedSessionGroup
        sessions={groupedSessions.thisWeek}
        label={t("sidebar.thisWeek")}
        currentSessionId={params.id}
      />
      <MemoizedSessionGroup
        sessions={groupedSessions.thisMonth}
        label={t("sidebar.thisMonth")}
        currentSessionId={params.id}
      />
      <MemoizedSessionGroup
        sessions={groupedSessions.older}
        label={t("sidebar.older")}
        currentSessionId={params.id}
      />
    </>
  );
}

function ChatSidebarMenuFooter() {
  const { user, isLoading, supabase } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const router = useRouter();
  const t = useTranslations();
  useEffect(() => {
    if (!user && !isLoading) {
      setIsLoggedIn(false);
      setIsDisabled(true);
      return;
    }

    if (user && !isLoading) {
      setIsLoggedIn(!!user);
      setIsDisabled(false);
    }
  }, [isLoading, user]);

  const handleAuth = async () => {
    if (isLoggedIn && supabase) {
      await supabase.auth.signOut();
    } else {
      if (isDisabled) {
        toast.error(t("common.error.occurred"), {
          description: t("account.authDisabled"),
        });
        return;
      }
      router.push("/login");
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <SidebarMenu className="mt-auto mb-3 gap-3">
      <AccountDropdownMenu
        user={user}
        isDisabled={isDisabled}
        handleAuth={handleAuth}
      />
    </SidebarMenu>
  );
}

export function ChatSidebar() {
  const isMobile = useIsMobile();
  const t = useTranslations();

  // Include HubSidebar in desktop view
  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>
          <Button className="fixed top-2 left-2">
            <MoreHorizontal />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="text-center">
          <div className="h-[calc(100vh-8rem)] overflow-y-auto">
            <DrawerTitle className="inline-flex mt-3 justify-center">
              Deni AI
              <Badge className="ml-2" variant="secondary">
                {buildInfo.version}
              </Badge>
            </DrawerTitle>
            <DrawerDescription>{t("sidebar.chat")}</DrawerDescription>

            <ChatSidebarMenuSession />
            <ChatSidebarMenuFooter />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* 
          To avoid hydration mismatches, ensure that all data rendered here is static or provided at build time.
          If buildInfo.version is dynamic or only available on the client, render it only on the client.
        */}
        <SidebarGroup className="pt-6 pl-4 pb-0 relative mb-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Link
                href="/home"
                className="text-xl font-bold transition-all hover:text-muted-foreground group-data-[collapsible=icon]:hidden flex items-center"
              >
                Deni AI
              </Link>
              <Badge
                className="group-data-[collapsible=icon]:hidden flex items-center"
                variant="secondary"
              >
                v{buildInfo.version}
              </Badge>
            </div>
            <SidebarTrigger className="ml-auto group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:left-1/2 group-data-[collapsible=icon]:-translate-x-1/2 group-data-[collapsible=icon]:top-4" />
          </div>
        </SidebarGroup>
        <ChatSidebarMenuSession />
      </SidebarContent>
      <SidebarFooter>
        <ChatSidebarMenuFooter />
      </SidebarFooter>
    </Sidebar>
  );
}
