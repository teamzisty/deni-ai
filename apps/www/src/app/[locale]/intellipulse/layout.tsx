"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { useParams } from "next/navigation";
import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { SupabaseProvider } from "@/context/supabase-context";
import { SidebarProvider } from "@workspace/ui/components/sidebar";
import { IntellipulseSidebar } from "@/components/intellipulse-sidebar";
import { IntellipulseSessionsProvider } from "@/hooks/use-intellipulse-sessions";
import { SettingsDialogProvider } from "@/context/settings-dialog-context";
import { SettingsProvider } from "@/hooks/use-settings";
import { SettingsDialog } from "@/components/settings-dialog";

export default function IntellipulseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale } = useParams() as { locale: string };
  return (
    <TooltipProvider>
      <SidebarProvider>
        <SupabaseProvider>
          <AuthProvider>
            <SettingsProvider>
              <SettingsDialogProvider>
                <IntellipulseSessionsProvider>
                  <IntellipulseSidebar />
                  {children}
                  <SettingsDialog />
                </IntellipulseSessionsProvider>
              </SettingsDialogProvider>
            </SettingsProvider>
          </AuthProvider>
        </SupabaseProvider>
      </SidebarProvider>
    </TooltipProvider>
  );
}