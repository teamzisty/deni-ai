import { Loading } from "@/components/loading";
import { Suspense } from "react";

import { SidebarProvider } from "@workspace/ui/components/sidebar";
import { ChatSidebar } from "@/components/chat-sidebar";
import { AuthProvider } from "@/context/AuthContext";
import { cookies } from "next/headers";
import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { ChatSessionsProvider } from "@/hooks/use-chat-sessions";
import { SettingsDialogProvider } from "@/context/SettingsDialogContext";
import { SettingsDialog } from "@/components/SettingsDialog";
import UpdateAlert from "@/components/UpdateAlert";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";
  const updateAlert = cookieStore.get("update_alert")?.value === "true";

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
                  <UpdateAlert
                    open={!updateAlert}
                  />
                </div>
              </AuthProvider>
            </SidebarProvider>
          </SettingsDialogProvider>
        </ChatSessionsProvider>
      </TooltipProvider>
    </div>
  );
}
