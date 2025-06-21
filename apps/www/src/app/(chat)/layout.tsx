import { SupabaseProvider } from "@/context/supabase-context";
import { CanvasProvider } from "@/context/canvas-context";
import { ConversationsProvider } from "@/hooks/use-conversations";
import { SidebarProvider } from "@workspace/ui/components/sidebar";
import { ChatLayoutContent } from "@/components/chat-layout-content";
import { UserDropdownMenu } from "@/components/chat/user-dropdown-menu";

export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <SupabaseProvider>
        <ConversationsProvider>
          <CanvasProvider>
            <ChatLayoutContent>
              {children}
              <UserDropdownMenu />
            </ChatLayoutContent>
          </CanvasProvider>
        </ConversationsProvider>
      </SupabaseProvider>
    </SidebarProvider>
  );
}
