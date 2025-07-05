import { SupabaseProvider } from "@/context/supabase-context";
import { CanvasProvider } from "@/context/canvas-context";
import { ConversationsProvider } from "@/hooks/use-conversations";
import { SidebarProvider } from "@workspace/ui/components/sidebar";
import { ChatLayoutContent } from "@/components/chat-layout-content";
import { UserDropdownMenu } from "@/components/chat/user-dropdown-menu";
import { SettingsDialogProvider } from "@/context/settings-dialog-context";
import { SettingsProvider } from "@/hooks/use-settings";
import { HubsProvider } from "@/hooks/use-hubs";

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
            <SettingsProvider>
              <SettingsDialogProvider>
                <HubsProvider>
                  <ChatLayoutContent>
                    {children}
                    <UserDropdownMenu />
                  </ChatLayoutContent>
                </HubsProvider>
              </SettingsDialogProvider>
            </SettingsProvider>
          </CanvasProvider>
        </ConversationsProvider>
      </SupabaseProvider>
    </SidebarProvider>
  );
}
