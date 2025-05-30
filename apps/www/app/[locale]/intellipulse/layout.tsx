"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { useParams } from "next/navigation";
import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { SidebarProvider } from "@workspace/ui/components/sidebar";
import { IntellipulseSidebar } from "@/components/intellipulse-sidebar";
import { IntellipulseSessionsProvider } from "@/hooks/use-intellipulse-sessions";
import { SettingsDialogProvider } from "@/context/SettingsDialogContext";
import { SettingsDialog } from "@/components/SettingsDialog";

export default function IntellipulseLayout({ children }: { children: React.ReactNode }) {
  const { locale } = useParams() as { locale: string };
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AuthProvider>
          <SettingsDialogProvider>
            <IntellipulseSessionsProvider> 
              <IntellipulseSidebar />
              {children}
              <SettingsDialog />
            </IntellipulseSessionsProvider>
          </SettingsDialogProvider>
        </AuthProvider>
      </SidebarProvider>
    </TooltipProvider>
  );
}
