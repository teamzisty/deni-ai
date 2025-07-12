"use client";

import {
  IntellipulseSession,
  useIntellipulseSessions,
} from "@/hooks/use-intellipulse-sessions";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import {
  Code2,
  GitBranch,
  HomeIcon,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@workspace/ui/components/badge";
import { useParams } from "next/navigation";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
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
// import { buildInfo } from "@/lib/version"; // Component not available
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
  today: IntellipulseSession[];
  yesterday: IntellipulseSession[];
  thisWeek: IntellipulseSession[];
  thisMonth: IntellipulseSession[];
  older: IntellipulseSession[];
}

function groupSessionsByDate(sessions: IntellipulseSession[]): GroupedSessions {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return {
    older: sessions.filter(
      (session) => new Date(session.createdAt) <= oneMonthAgo,
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
      (session) => new Date(session.createdAt) > oneDayAgo,
    ),
  };
}

function IntellipulseContextMenu({
  session,
  children,
}: {
  session: IntellipulseSession;
  children: React.ReactNode;
}) {
  const { deleteSession } = useIntellipulseSessions();
  const t = useTranslations();

  const handleDelete = (e: React.MouseEvent) => {
    // Prevent default context menu behavior if triggered from action
    e.preventDefault();
    deleteSession(session.id);
  };

  return (
    <AlertDialog>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <AlertDialogTrigger asChild>
            <ContextMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>{t("contextMenu.delete")}</span>
            </ContextMenuItem>
          </AlertDialogTrigger>
          {/* Add other context menu items here if needed */}
        </ContextMenuContent>
      </ContextMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("contextMenu.deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("contextMenu.deleteDescription", {
              title: session.title,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t("common.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function SessionGroup({
  sessions,
  label,
  currentSessionId,
}: {
  sessions: IntellipulseSession[];
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
                <IntellipulseContextMenu session={session}>
                  <SidebarMenuButton
                    className="flex"
                    isActive={currentSessionId === session.id}
                    asChild
                    tooltip={session.title}
                  >
                    <Link href={`/intellipulse/chat/${session.id}`}>
                      <Code2 className="mr-2" />
                      <span className="truncate">{session.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </IntellipulseContextMenu>
              </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function IntellipulseSidebarMenuSession() {
  const { sessions, createSession } = useIntellipulseSessions();
  const params = useParams<{ id: string }>();
  const groupedSessions = groupSessionsByDate(sessions);
  const t = useTranslations();
  const router = useRouter();
  const [isGitCloneOpen, setIsGitCloneOpen] = useState(false);

  const handleCreate = () => {
    const session = createSession();
    router.push(`/intellipulse/chat/${session.id}`);
  };

  return (
    <>
      {" "}
      <SidebarGroup>
        <SidebarGroupLabel className="text-xs text-muted-foreground font-medium mb-2">
          {t("intellipulseSidebar.quickActions")}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                variant={"outline"}
                size="lg"
                className="flex items-center justify-center gap-2 h-10"
                onClick={handleCreate}
                tooltip={
                  t("intellipulseSidebar.newIntellipulseChat") ||
                  "New Intellipulse Chat"
                }
                data-sidebar="menu-button"
                data-size="lg"
              >
                <Plus className="h-4 w-4" />
                <span className="group-data-[collapsible=icon]:hidden">
                  {t("intellipulseSidebar.newIntellipulseChat") ||
                    "New Intellipulse Chat"}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      {(groupedSessions.today.length > 0 ||
        groupedSessions.yesterday.length > 0 ||
        groupedSessions.thisWeek.length > 0 ||
        groupedSessions.thisMonth.length > 0 ||
        groupedSessions.older.length > 0) && (
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground font-medium">
            {t("intellipulseSidebar.recentSessions")}
          </SidebarGroupLabel>
        </SidebarGroup>
      )}
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

export function IntellipulseSidebar() {
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
              Deni AI Intellipulse
              <Badge className="ml-2" variant="secondary">
                {"1.0.0"}
              </Badge>
            </DrawerTitle>
            <DrawerDescription>
              {t("intellipulseSidebar.intellipulse") || "Intellipulse"}
            </DrawerDescription>
            <IntellipulseSidebarMenuSession />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup className="pt-6 pl-4 pb-0 relative mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Link
                href="/intellipulse"
                className="text-xl font-bold transition-all hover:text-muted-foreground group-data-[collapsible=icon]:hidden flex items-center"
              >
                <Image
                  src="/assets/icon.png"
                  alt="Deni AI"
                  className="mr-2"
                  width={20}
                  height={20}
                />
                Intellipulse
              </Link>
            </div>
            <SidebarTrigger className="ml-auto group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:left-1/2 group-data-[collapsible=icon]:-translate-x-1/2 group-data-[collapsible=icon]:top-4" />
          </div>
        </SidebarGroup>
        <IntellipulseSidebarMenuSession />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu className="mt-auto mb-3 gap-3">
          <span className="text-xs mx-auto text-muted-foreground group-data-[collapsible=icon]:hidden">
            {t("intellipulseSidebar.publicBeta")}
          </span>
          <SidebarMenuItem>
            <Link href="/">
              <Button variant="outline" size="sm" className="w-full">
                <HomeIcon className="mr-2 h-4 w-4 hidden group-data-[collapsible=icon]:block" />
                <span className="group-data-[collapsible=icon]:hidden">
                  {t("intellipulseSidebar.backToHome") || "Back to Home"}
                </span>
              </Button>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
