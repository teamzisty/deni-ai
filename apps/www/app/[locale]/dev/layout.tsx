"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { useParams } from "next/navigation";
import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { SidebarProvider } from "@workspace/ui/components/sidebar";
import { DevSidebar } from "@/components/dev-sidebar";
import { DevSessionsProvider } from "@/hooks/use-dev-sessions";

export default function DevLayout({ children }: { children: React.ReactNode }) {
  const { locale } = useParams() as { locale: string };
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AuthProvider>
          <DevSessionsProvider> 
            <DevSidebar />
            {children}
          </DevSessionsProvider>
        </AuthProvider>
      </SidebarProvider>
    </TooltipProvider>
  );
}
