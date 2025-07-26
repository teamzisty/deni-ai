"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { UsageInfo } from "@/lib/usage";
import { models } from "@/lib/constants";

interface SupabaseContextType {
  user: User | null;
  session: Session | null;
  usage: UsageInfo[] | null; // current usage information
  ssUserData: { plan: string } | null; // server-side user data
  supabase: typeof supabase;
  loading: boolean;
  secureFetch: (url: string, options?: RequestInit) => Promise<Response>;
  clientAddUses: (model: string) => Promise<void>; // function to add usage on the client side
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(
  undefined,
);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ssUserData, setSsUserData] = useState<{ plan: string } | null>(null); // server-side user data
  const [usage, setUsage] = useState<UsageInfo[] | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const secureFetch = async (url: string, options?: RequestInit) => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) {
      console.error(error);
      throw new Error("Failed to get session");
    }
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        Authorization: `Bearer ${session?.access_token}`,
      },
    });
    return response;
  };

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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (newSession?.user?.id === session?.user?.id) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);

      if (newSession?.user) {
        const getSsData = async () => {
          try {
            // Get user data directly from Supabase
            const { data, error } = await supabase
              .from("users")
              .select("*")
              .eq("id", newSession.user.id)
              .single();

            if (error) {
              console.error("Supabase error:", error);
              return;
            }

            setSsUserData(data);
          } catch (error) {
            console.error(error);
          }
        };
        const getUsage = async () => {
          try {
            const today = new Date().toISOString().split("T")[0];

            // Get all usage data for today in a single query
            const { data: usageData, error } = await supabase
              .from("uses")
              .select("model, count")
              .eq("user_id", newSession.user.id)
              .eq("date", today);

            if (error) {
              console.error("Supabase error:", error);
              return;
            }

            // Create a map for quick lookup
            const usageMap = new Map<string, number>();
            if (usageData) {
              for (const usage of usageData) {
                usageMap.set(usage.model, usage.count);
              }
            }

            // Generate results for all models - simplified version
            const results: UsageInfo[] = [];
            for (const [modelKey, modelData] of Object.entries(models)) {
              const currentCount = usageMap.get(modelKey) ?? 0;
              const premium = models[modelKey]?.premium || false;
              const limit = premium ? 30 : -1; // Simplified: 30 for premium, unlimited for others
              const canUse = limit === -1 || currentCount < limit;
              const remaining = limit === -1 ? -1 : Math.max(0, limit - currentCount);

              results.push({
                model: modelKey,
                count: currentCount,
                limit,
                premium,
                canUse,
                remaining,
              });
            }

            setUsage(results);
          } catch (error) {
            console.error(error);
          }
        };
        await Promise.all([getSsData(), getUsage()]);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const value = {
    user,
    ssUserData,
    usage,
    session,
    supabase,
    loading,
    secureFetch,
    clientAddUses,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }
  return context;
}
