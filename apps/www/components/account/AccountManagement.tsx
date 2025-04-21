"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { AccountDropdownMenu } from "../AccountDropdownMenu";
import { useIsMobile } from "@/hooks/use-mobile";

export const AccountManagement = () => {
  const { user, auth } = useAuth();
  const isMobile = typeof window !== "undefined" ? require("@/hooks/use-mobile").useIsMobile() : false;
  if (isMobile) return null;
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
