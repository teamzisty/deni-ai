import { AuthProvider } from "@/context/auth-context";
import { CanvasProvider } from "@/context/canvas-context";
import { ConversationsProvider } from "@/hooks/use-conversations";
import { SidebarProvider } from "@workspace/ui/components/sidebar";
import { ChatLayoutContent } from "@/components/chat-layout-content";
import { UserDropdownMenu } from "@/components/chat/user-dropdown-menu";
import { SettingsDialogProvider } from "@/context/settings-dialog-context";
import { SettingsProvider } from "@/hooks/use-settings";
import { HubsProvider } from "@/hooks/use-hubs";
import { ColorThemeProvider } from "@/context/color-theme-context";
import { AuthGuard } from "@/components/auth-guard";
import { cookies } from "next/headers";

export default async function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AuthProvider>
        <ConversationsProvider>
          <AuthGuard>
            <CanvasProvider>
              <SettingsProvider>
                <ColorThemeProvider>
                  <SettingsDialogProvider>
                    <HubsProvider>
                      <ChatLayoutContent>
                        {children}
                        <UserDropdownMenu />
                      </ChatLayoutContent>
                    </HubsProvider>
                  </SettingsDialogProvider>
                </ColorThemeProvider>
              </SettingsProvider>
            </CanvasProvider>
          </AuthGuard>
        </ConversationsProvider>
      </AuthProvider>
    </SidebarProvider>
  );
}
