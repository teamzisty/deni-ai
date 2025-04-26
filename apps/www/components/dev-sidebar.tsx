"use client";

import { DevSession, useDevSessions } from "@/hooks/use-dev-sessions";
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
import { Code2, MoreHorizontal, Plus, Server } from "lucide-react";
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
import { useTranslations } from "next-intl";
import { buildInfo } from "@/lib/version";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import Image from "next/image";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@workspace/ui/components/context-menu";
import { useState } from "react";

interface GroupedSessions {
  today: DevSession[];
  yesterday: DevSession[];
  thisWeek: DevSession[];
  thisMonth: DevSession[];
  older: DevSession[];
}

function groupSessionsByDate(sessions: DevSession[]): GroupedSessions {
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

function DevContextMenu({
  session,
  children,
}: {
  session: DevSession;
  children: React.ReactNode;
}) {
  const { deleteSession } = useDevSessions();
  const t = useTranslations();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(true);
  };

  const confirmDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteSession(session.id);
    setShowConfirm(false);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(false);
  };

  return (
    <div className="group relative flex items-center">
      {children}
      <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {!showConfirm ? (
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5"
            onClick={handleDelete}
          >
            <span className="sr-only">Delete</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-destructive"
            >
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
          </Button>
        ) : (
          <div className="flex bg-background border rounded p-1 shadow-md">
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5 text-destructive"
              onClick={confirmDelete}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span className="sr-only">Confirm</span>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5"
              onClick={cancelDelete}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              <span className="sr-only">Cancel</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function SessionGroup({
  sessions,
  label,
  currentSessionId,
}: {
  sessions: DevSession[];
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
                <DevContextMenu session={session}>
                  <SidebarMenuButton
                    className="flex"
                    isActive={currentSessionId === session.id}
                    asChild
                    tooltip={session.title}
                  >
                    <Link href={`/dev/chat/${session.id}`}>
                      <Code2 className="mr-2" />
                      <span className="truncate">{session.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </DevContextMenu>
              </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function DevSidebarMenuSession() {
  const { sessions, createSession } = useDevSessions();
  const params = useParams<{ id: string }>();
  const groupedSessions = groupSessionsByDate(sessions);
  const t = useTranslations();
  const router = useRouter();

  const handleCreate = () => {
    const session = createSession();
    router.push(`/dev/chat/${session.id}`);
  };

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
                onClick={handleCreate}
                tooltip={t("devSidebar.newDevChat") || "New Dev Chat"}
                data-sidebar="menu-button"
                data-size="lg"
              >
                <Plus />
                <span className="group-data-[collapsible=icon]:hidden">
                  {t("devSidebar.newDevChat") || "New Dev Chat"}
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

export function DevSidebar() {
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
              Deni AI Dev
              <Badge className="ml-2" variant="secondary">
                {buildInfo.version}
              </Badge>
            </DrawerTitle>
            <DrawerDescription>
              {t("devSidebar.devMode") || "Development Mode"}
            </DrawerDescription>
            <DevSidebarMenuSession />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup className="pt-6 pl-4 pb-0 relative mb-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Link
                href="/dev"
                className="text-xl font-bold transition-all hover:text-muted-foreground group-data-[collapsible=icon]:hidden flex items-center"
              >
                <Image
                  src="/assets/icon.png"
                  alt="Deni AI"
                  className="mr-2"
                  width={20}
                  height={20}
                />
                Deni AI{" "}
                <Badge
                  className="group-data-[collapsible=icon]:hidden ml-2 flex items-center"
                  variant="secondary"
                >
                  {t("devSidebar.devMode")}
                </Badge>
              </Link>
            </div>
            <SidebarTrigger className="ml-auto group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:left-1/2 group-data-[collapsible=icon]:-translate-x-1/2 group-data-[collapsible=icon]:top-4" />
          </div>
        </SidebarGroup>
        <DevSidebarMenuSession />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu className="mt-auto mb-3 gap-3">
          <SidebarMenuItem>
            <Link href="/home">
              <Button variant="outline" size="sm" className="w-full">
                {t("sidebar.backToHome") || "Back to Home"}
              </Button>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
