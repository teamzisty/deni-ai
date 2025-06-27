"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Bot } from "@/lib/bot";
import { useSupabase } from "@/context/supabase-context";

interface BotsCacheContextType {
  getBot: (botId: string) => Promise<Bot | null>;
  isLoading: (botId: string) => boolean;
}

const BotsCacheContext = createContext<BotsCacheContextType | undefined>(
  undefined,
);

interface BotsCacheProviderProps {
  children: React.ReactNode;
}

export function BotsCacheProvider({ children }: BotsCacheProviderProps) {
  const [cache, setCache] = useState<Map<string, Bot>>(new Map());
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const { secureFetch } = useSupabase();

  const getBot = useCallback(
    async (botId: string): Promise<Bot | null> => {
      // Return cached bot if available
      if (cache.has(botId)) {
        return cache.get(botId) || null;
      }

      // Prevent duplicate requests for the same bot
      if (loading.has(botId)) {
        // Wait for the existing request to complete
        return new Promise((resolve) => {
          const checkCache = () => {
            if (cache.has(botId)) {
              resolve(cache.get(botId) || null);
            } else if (!loading.has(botId)) {
              resolve(null);
            } else {
              setTimeout(checkCache, 50);
            }
          };
          checkCache();
        });
      }

      // Start loading
      setLoading((prev) => new Set(prev).add(botId));

      try {
        const response = await secureFetch(`/api/bots/${botId}`);
        const bot = response.data as Bot;

        // Cache the result
        setCache((prev) => new Map(prev).set(botId, bot));
        
        return bot;
      } catch (error) {
        console.error("Failed to fetch bot:", error);
        return null;
      } finally {
        // Stop loading
        setLoading((prev) => {
          const newSet = new Set(prev);
          newSet.delete(botId);
          return newSet;
        });
      }
    },
    [cache, loading, secureFetch],
  );

  const isLoading = useCallback(
    (botId: string): boolean => {
      return loading.has(botId);
    },
    [loading],
  );

  const value: BotsCacheContextType = {
    getBot,
    isLoading,
  };

  return (
    <BotsCacheContext.Provider value={value}>
      {children}
    </BotsCacheContext.Provider>
  );
}

export function useBotsCache(): BotsCacheContextType {
  const context = useContext(BotsCacheContext);
  if (context === undefined) {
    throw new Error("useBotsCache must be used within a BotsCacheProvider");
  }
  return context;
}