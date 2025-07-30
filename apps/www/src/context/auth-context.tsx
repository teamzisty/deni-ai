"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { UsageInfo } from "@/lib/usage";
import { models } from "@/lib/constants";
import { User, Session } from "better-auth";
import { trpc } from "@/trpc/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  usage: UsageInfo[] | null; // current usage information
  clientAddUses: (model: string) => Promise<void>; // function to add usage on the client side
  isPending: boolean;
  error: Error | null;
  serverUserData: any | null;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usage, setUsage] = useState<UsageInfo[] | null>(null);
  const { data: session, isPending, error } = useSession();
  const [serverUserData, setServerUserData] = useState<any | null>(null);
  const { data: user } = trpc.user.getUser.useQuery();
  const { data: usageData } = trpc.user.getUsage.useQuery();

  const clientAddUses = async (model: string) => {
    const target = usage?.find((u) => u.model === model);
    if (target) {
      const updatedUsage = usage?.map((u) =>
        u.model === model
          ? { ...u, count: u.count + 1, remaining: u.remaining - 1 }
          : u,
      );
      if (!updatedUsage) return;
      setUsage(updatedUsage);
    } else {
      const newUsage = {
        model,
        count: 1,
        limit: 30,
        canUse: true,
        premium: models[model]?.premium || false,
        remaining: 29,
      } as UsageInfo;
      setUsage((prev) => (prev ? [...prev, newUsage] : [newUsage]));
      console.log(`Added new usage for model ${model}: 1 use`);
    }
  };

  useEffect(() => {
    if (user) {
      setServerUserData(user);
    }
  }, [user]);

  useEffect(() => {
    if (usageData) {
      setUsage(usageData);
    }
  }, [usageData]);

  const value = {
    user: session?.user || null,
    serverUserData: serverUserData || null,
    session: session?.session || null,
    usage,
    isPending,
    error,
    clientAddUses,
  };
  return (
    <AuthContext.Provider value={value as AuthContextType}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a AuthProvider");
  }
  return context;
}
