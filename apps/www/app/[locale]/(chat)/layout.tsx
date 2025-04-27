import { Loading } from "@/components/loading";
import { Suspense } from "react";
import { ThemeProvider } from "@workspace/ui/components/theme-provider";

import { SidebarProvider } from "@workspace/ui/components/sidebar";
import { ChatSidebar } from "@/components/chat-sidebar";
import { AuthProvider } from "@/context/AuthContext";
import { cookies } from "next/headers";
import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { ChatSessionsProvider } from "@/hooks/use-chat-sessions";
import { SettingsDialogProvider } from "@/context/SettingsDialogContext";
import { SettingsDialog } from "@/components/SettingsDialog";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <div className="w-full h-full">
      <TooltipProvider>
        <ChatSessionsProvider>
          <SettingsDialogProvider>
            <SidebarProvider defaultOpen={defaultOpen}>
              <AuthProvider>
                <div className="w-full flex">
                  <ChatSidebar />
                  <Suspense fallback={<Loading />}>{children}</Suspense>

                  <SettingsDialog />
                </div>
              </AuthProvider>
            </SidebarProvider>
          </SettingsDialogProvider>
        </ChatSessionsProvider>
      </TooltipProvider>
    </div>
  );
}
