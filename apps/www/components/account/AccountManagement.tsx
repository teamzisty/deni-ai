"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { AccountDropdownMenu } from "../AccountDropdownMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@workspace/ui/components/skeleton";

export const AccountManagement = () => {
  const { user, auth, isLoading } = useAuth();
  const isMobile =
    typeof window !== "undefined"
      ? require("@/hooks/use-mobile").useIsMobile()
      : false;
  if (isMobile) return null;

  if (isLoading) {
    return (
      <div className="flex items-center mt-2 gap-2">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <AccountDropdownMenu
        user={user}
        handleAuth={async () => {
          await auth?.signOut();
        }}
      />
    </div>
  );
};
