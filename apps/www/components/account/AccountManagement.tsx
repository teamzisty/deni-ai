"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { AccountDropdownMenu } from "../AccountDropdownMenu";

export const AccountManagement = () => {
  const { user, auth } = useAuth();

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
