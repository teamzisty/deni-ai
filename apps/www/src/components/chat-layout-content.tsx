"use client";

import { useCanvas } from "@/context/canvas-context";
import { Toaster } from "sonner";
import { CanvasPanel } from "./canvas-panel";
import { ChatSidebar } from "./chat-sidebar";
import { HiddenElement } from "./hidden-element";
import { SettingsDialog } from "./settings-dialog";
import { SidebarTrigger } from "@workspace/ui/components/sidebar";

export function ChatLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCanvasOpen, canvasContent, closeCanvas } = useCanvas();

  return (
    <div className="w-screen h-screen flex flex-col md:flex-row">
      <ChatSidebar />

      <main className="flex-1 overflow-y-auto p-4">
        <SidebarTrigger className="top-4.5 left-5 absolute" />
        {children}
      </main>
      <CanvasPanel
        isOpen={isCanvasOpen}
        onClose={closeCanvas}
        initialContent={canvasContent}
      />

      <HiddenElement />
      <Toaster richColors position="top-center" />

      <SettingsDialog />
    </div>
  );
}
