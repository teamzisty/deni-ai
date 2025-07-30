"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "@/context/auth-context";
import { trpc } from "@/trpc/client";

export interface ClientHub {
  id: string;
  name: string;
  description: string;
  files: any[];
  conversations: string[];
  created_by: {
    name: string;
    verified: boolean;
    id: string;
  };
  created_at: number;
}

interface HubsContextType {
  hubs: ClientHub[];
  loading: boolean;
  error: string | null;
  createHub: (name: string, description: string) => Promise<ClientHub | null>;
  addConversationToHub: (
    hubId: string,
    conversationId: string,
  ) => Promise<boolean>;
  removeConversationFromHub: (
    hubId: string,
    conversationId: string,
  ) => Promise<boolean>;
}

const HubsContext = createContext<HubsContextType | undefined>(undefined);

interface HubsProviderProps {
  children: ReactNode;
}

export function HubsProvider({ children }: HubsProviderProps) {
  const { user } = useAuth();
  const {
    data: hubs,
    isLoading: isLoadingHubs,
    refetch: refetchHubs,
  } = trpc.hub.getHubs.useQuery();
  const { mutateAsync: trpcCreateHub, isPending: isCreatingHub } =
    trpc.hub.createHub.useMutation();
  const {
    mutateAsync: trpcAddConversationToHub,
    isPending: isAddingConversationToHub,
  } = trpc.conversation.addConversationToHub.useMutation();
  const {
    mutateAsync: trpcRemoveConversationFromHub,
    isPending: isRemovingConversationFromHub,
  } = trpc.conversation.removeConversationFromHub.useMutation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createHub = useCallback(
    async (name: string, description: string): Promise<ClientHub | null> => {
      if (!user || !name.trim() || !description.trim()) return null;

      setError(null);

      try {
        const newHub = await trpcCreateHub({
          name,
          description,
        });

        return (newHub as unknown as ClientHub) || null;
      } catch (err) {
        console.error("Error creating hub:", err);
        setError("Failed to create hub");
        return null;
      }
    },
    [user],
  );

  const addConversationToHub = useCallback(
    async (hubId: string, conversationId: string): Promise<boolean> => {
      if (!user) return false;

      setError(null);

      try {
        await trpcAddConversationToHub({
          conversationId,
          hubId,
        });

        // Refresh hubs to get updated data
        await refetchHubs();
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to add conversation to hub";
        setError(errorMessage);
        console.error("Hub error:", err);
        return false;
      }
    },
    [user, refetchHubs],
  );

  const removeConversationFromHub = useCallback(
    async (hubId: string, conversationId: string): Promise<boolean> => {
      if (!user) return false;

      setError(null);

      try {
        await trpcRemoveConversationFromHub({
          conversationId,
          hubId,
        });

        // Refresh hubs to get updated data
        await refetchHubs();
        return true;
      } catch (err) {
        console.error("Error removing conversation from hub:", err);
        setError("Failed to remove conversation from hub");
        return false;
      }
    },
    [user, refetchHubs],
  );

  const value: HubsContextType = {
    hubs: (hubs as unknown as ClientHub[]) || [],
    loading: isLoadingHubs || isCreatingHub,
    error,
    createHub,
    addConversationToHub,
    removeConversationFromHub,
  };

  return <HubsContext.Provider value={value}>{children}</HubsContext.Provider>;
}

export function useHubs(): HubsContextType {
  const context = useContext(HubsContext);
  if (context === undefined) {
    throw new Error("useHubs must be used within a HubsProvider");
  }
  return context;
}
