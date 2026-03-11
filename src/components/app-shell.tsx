"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { ChatSearch } from "@/components/chat/chat-search";
import { FlixaBanner } from "@/components/flixa-banner";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isChatSearchOpen, setIsChatSearchOpen] = useState(false);

  return (
    <SidebarProvider>
      <ChatSearch open={isChatSearchOpen} onOpenChange={setIsChatSearchOpen} />
      <AppSidebar onOpenChatSearch={() => setIsChatSearchOpen(true)} />
      <SidebarInset>
        <FlixaBanner />
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
