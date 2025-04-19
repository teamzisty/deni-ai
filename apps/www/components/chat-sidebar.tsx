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
import { MessageCircleMore, MoreHorizontal, Plus } from "lucide-react";
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
import { useEffect, useState } from "react";
import { AccountDropdownMenu } from "./AccountDropdownMenu";
import { ChatContextMenu } from "./context-menu";
import { buildInfo } from "@/lib/version";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

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
    older: sessions.filter(
      (session) => new Date(session.createdAt) <= oneMonthAgo
    ),
    thisMonth: sessions.filter((session) => {
      const date = new Date(session.createdAt);
      return date <= oneWeekAgo && date > oneMonthAgo;
    }),
    thisWeek: sessions.filter((session) => {
      const date = new Date(session.createdAt);
      return date <= twoDaysAgo && date > oneWeekAgo;
    }),
    yesterday: sessions.filter((session) => {
      const date = new Date(session.createdAt);
      return date <= oneDayAgo && date > twoDaysAgo;
    }),
    today: sessions.filter(
      (session) => new Date(session.createdAt) > oneDayAgo
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

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {sessions
            .slice()
            .reverse()
            .map((session) => (
              <SidebarMenuItem key={session.id}>
                <ChatContextMenu session={session}>
                  <SidebarMenuButton
                    className="flex"
                    isActive={currentSessionId === session.id}
                    asChild
                    tooltip={session.title}
                  >
                    <Link href={`/chat/${session.id}`}>
                      <MessageCircleMore className="mr-2" />
                      <span className="truncate">{session.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </ChatContextMenu>
              </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
function ChatSidebarMenuSession() {
  const { sessions, createSession } = useChatSessions();
  const params = useParams<{ id: string }>();
  const groupedSessions = groupSessionsByDate(sessions);
  const t = useTranslations();

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                variant={"outline"}
                size="lg"
                className="flex items-center justify-center"
                onClick={createSession}
                tooltip={t("sidebar.newChat")}
                data-sidebar="menu-button"
                data-size="lg"
              >
                <Plus />
                {/* クライアントサイドのみでレンダリングするようにする */}
                <span className="group-data-[collapsible=icon]:hidden">
                  {t("sidebar.newChat")}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SessionGroup
        sessions={groupedSessions.today}
        label={t("sidebar.today")}
        currentSessionId={params.id}
      />
      <SessionGroup
        sessions={groupedSessions.yesterday}
        label={t("sidebar.yesterday")}
        currentSessionId={params.id}
      />
      <SessionGroup
        sessions={groupedSessions.thisWeek}
        label={t("sidebar.thisWeek")}
        currentSessionId={params.id}
      />
      <SessionGroup
        sessions={groupedSessions.thisMonth}
        label={t("sidebar.thisMonth")}
        currentSessionId={params.id}
      />
      <SessionGroup
        sessions={groupedSessions.older}
        label={t("sidebar.older")}
        currentSessionId={params.id}
      />
    </>
  );
}

function ChatSidebarMenuFooter() {
  const { user, isLoading, auth } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const router = useRouter();
  const t = useTranslations();

  useEffect(() => {
    if (!auth && !isLoading) {
      setIsLoggedIn(false);
      setIsDisabled(true);
      return;
    }

    if (auth && !isLoading) {
      setIsLoggedIn(!!user);
      setIsDisabled(false);
    }
  }, [isLoading, auth, user]);

  const handleAuth = async () => {
    if (isLoggedIn && auth) {
      await auth.signOut();
    } else {
      if (isDisabled) {
        toast.error(t("account.error"), {
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
      <AccountDropdownMenu user={user} isDisabled={isDisabled} handleAuth={handleAuth} />
    </SidebarMenu>
  );
}

export function ChatSidebar() {
  const isMobile = useIsMobile();
  const t = useTranslations();

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
              {/* Only render version on client to avoid hydration issues if buildInfo.version is dynamic */}
              {typeof window === "undefined" ? null : (
                <Badge
                  className="group-data-[collapsible=icon]:hidden flex items-center"
                  variant="secondary"
                >
                  v{buildInfo.version}
                </Badge>
              )}
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
