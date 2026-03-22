"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { FlixaBanner } from "@/components/flixa-banner";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const AppSidebar = dynamic(() => import("@/components/app-sidebar").then((mod) => mod.AppSidebar));
const ChatSearch = dynamic(
  () => import("@/components/chat/chat-search").then((mod) => mod.ChatSearch),
  { ssr: false },
);

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isChatSearchOpen, setIsChatSearchOpen] = useState(false);
  const newChatRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const role = target?.getAttribute("role");
      const isEditable =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          role === "textbox");
      if (isEditable) {
        return;
      }

      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      if (mod && key === "k") {
        e.preventDefault();
        setIsChatSearchOpen(true);
      }
      if (mod && key === "n") {
        e.preventDefault();
        newChatRef.current?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <SidebarProvider>
      <ChatSearch open={isChatSearchOpen} onOpenChange={setIsChatSearchOpen} />
      <AppSidebar onOpenChatSearch={() => setIsChatSearchOpen(true)} onNewChatRef={newChatRef} />
      <SidebarInset>
        <FlixaBanner />
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
