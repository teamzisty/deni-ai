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
} from "@/components/ui/sidebar";
import { MessageCircleMore, MoreHorizontal, Plus } from "lucide-react";
import { Link } from "next-view-transitions";
import { Badge } from "@/components/ui/badge";
import { useParams } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase/config";
import { useEffect, useState } from "react";
import { AccountDropdownMenu } from "./AccountDropdownMenu";
import { User } from "firebase/auth";
import { ChatContextMenu } from "./context-menu";

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
              >
                <Plus />
                新しい会話
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SessionGroup
        sessions={groupedSessions.today}
        label="今日"
        currentSessionId={params.id}
      />
      <SessionGroup
        sessions={groupedSessions.yesterday}
        label="昨日"
        currentSessionId={params.id}
      />
      <SessionGroup
        sessions={groupedSessions.thisWeek}
        label="今週"
        currentSessionId={params.id}
      />
      <SessionGroup
        sessions={groupedSessions.thisMonth}
        label="今月"
        currentSessionId={params.id}
      />
      <SessionGroup
        sessions={groupedSessions.older}
        label="それより前"
        currentSessionId={params.id}
      />
    </>
  );
}

function ChatSidebarMenuFooter() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  const handleAuth = async () => {
    if (isLoggedIn) {
      await auth.signOut();
    } else {
      window.location.href = "/login";
    }
  };

  return (
    <SidebarMenu className="mt-auto mb-3 gap-3">
      <SidebarMenuItem className="ml-1 bg-secondary rounded-md p-2">
        <span className="font-bold">Deni AI がアップデート</span>
        <br />
        <span className="text-sm text-muted-foreground">
          Deni AI v2.0.0
          がリリースされました！このバージョンではUIの革新や検索機能の追加などが行われました！
        </span>
      </SidebarMenuItem>
      <AccountDropdownMenu user={user} handleAuth={handleAuth} />
    </SidebarMenu>
  );
}

export function ChatSidebar() {
  const isMobile = useIsMobile();

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
                v2.0.0
              </Badge>
            </DrawerTitle>
            <DrawerDescription>チャット</DrawerDescription>

            <ChatSidebarMenuSession />
            <ChatSidebarMenuFooter />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup className="pt-6 pl-4 pb-0">
          <div className="flex items-center gap-2">
            <Link
              href="/home"
              className="text-xl font-bold transition-all hover:text-muted-foreground"
            >
              Deni AI
            </Link>
            <Badge>v2.0.1</Badge>
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
