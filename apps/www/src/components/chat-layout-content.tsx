"use client";

import { useCanvas } from "@/context/canvas-context";
import { Toaster } from "sonner";
import { CanvasPanel } from "./canvas-panel";
import { ChatSidebar } from "./chat-sidebar";
import { HiddenElement } from "./hidden-element";

export function ChatLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCanvasOpen, canvasContent, closeCanvas } = useCanvas();

  return (
    <div className="w-screen h-screen flex flex-col md:flex-row">
      <ChatSidebar />
      <main className="flex-1 overflow-y-auto p-4">
        {children}
      </main>
      <CanvasPanel
        isOpen={isCanvasOpen}
        onClose={closeCanvas}
        initialContent={canvasContent}
      />

      <HiddenElement />
      <Toaster richColors position="top-center" />
    </div>
  );
}