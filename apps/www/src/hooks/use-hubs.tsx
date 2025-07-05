"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase/client";

export interface Hub {
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
  hubs: Hub[];
  loading: boolean;
  error: string | null;
  createHub: (name: string, description: string) => Promise<Hub | null>;
  updateHub: (id: string, data: Partial<Hub>) => Promise<Hub | null>;
  deleteHub: (id: string) => Promise<boolean>;
  fetchHubs: () => Promise<void>;
  getHub: (id: string) => Promise<Hub | null>;
  refreshHubs: () => Promise<void>;
  addConversationToHub: (hubId: string, conversationId: string) => Promise<boolean>;
  removeConversationFromHub: (hubId: string, conversationId: string) => Promise<boolean>;
}

const HubsContext = createContext<HubsContextType | undefined>(undefined);

interface HubsProviderProps {
  children: ReactNode;
}

export function HubsProvider({ children }: HubsProviderProps) {
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const secureFetch = useCallback(
    async (url: string, options?: RequestInit) => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        throw new Error("Failed to get session");
      }
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Network response was not ok");
      }
      return response.json();
    },
    [],
  );

  const fetchHubs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await secureFetch("/api/hubs");
      if (!result.success) {
        setError(result.error);
        return;
      }

      setHubs(result.data);
    } catch (err) {
      setError("Failed to fetch hubs");
    } finally {
      setLoading(false);
    }
  }, [secureFetch]);

  const createHub = useCallback(
    async (name: string, description: string): Promise<Hub | null> => {
      setError(null);

      try {
        const response = await secureFetch("/api/hubs", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, description }),
        });

        if (!response.success) {
          setError(response.error);
          return null;
        }

        // After creating, we need to fetch the new hub data
        // since the API only returns hubId and hubUrl
        const newHubId = response.hubId;
        const newHub = await getHub(newHubId);
        
        if (newHub) {
          setHubs((prev) => [newHub, ...prev]);
          return newHub;
        }
        
        return null;
      } catch (err) {
        setError("Failed to create hub");
        return null;
      }
    },
    [secureFetch],
  );

  const updateHub = useCallback(
    async (id: string, data: Partial<Hub>): Promise<Hub | null> => {
      setError(null);

      try {
        const response = await secureFetch(`/api/hubs/${id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.success) {
          setError(response.error);
          return null;
        }

        // After updating, fetch the updated hub data
        const updatedHub = await getHub(id);
        if (updatedHub) {
          setHubs((prev) =>
            prev.map((hub) => (hub.id === id ? updatedHub : hub)),
          );
          return updatedHub;
        }
        
        return null;
      } catch (err) {
        setError("Failed to update hub");
        return null;
      }
    },
    [secureFetch],
  );

  const deleteHub = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null);

      try {
        const response = await secureFetch(`/api/hubs/${id}`, {
          method: "DELETE",
        });

        if (!response.success) {
          setError(response.error);
          return false;
        }

        setHubs((prev) => prev.filter((hub) => hub.id !== id));
        return true;
      } catch (err) {
        setError("Failed to delete hub");
        return false;
      }
    },
    [secureFetch],
  );

  const getHub = useCallback(
    async (id: string): Promise<Hub | null> => {
      setError(null);

      try {
        const response = await secureFetch(`/api/hubs/${id}`);
        if (!response.success) {
          setError(response.error);
          return null;
        }

        return response.data;
      } catch (err) {
        setError("Failed to get hub");
        return null;
      }
    },
    [secureFetch],
  );

  const refreshHubs = useCallback(async () => {
    await fetchHubs();
  }, [fetchHubs]);

  const addConversationToHub = useCallback(
    async (hubId: string, conversationId: string): Promise<boolean> => {
      setError(null);

      try {
        const response = await secureFetch(`/api/hubs/${hubId}/conversations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ conversationId }),
        });

        if (!response.success) {
          const errorMessage = response.error || "Failed to add conversation to hub";
          setError(errorMessage);
          console.error("Hub API error:", errorMessage);
          return false;
        }

        // Refresh hubs to get updated data
        await refreshHubs();
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to add conversation to hub";
        setError(errorMessage);
        console.error("Hub API error:", err);
        return false;
      }
    },
    [secureFetch, refreshHubs],
  );

  const removeConversationFromHub = useCallback(
    async (hubId: string, conversationId: string): Promise<boolean> => {
      setError(null);

      try {
        const response = await secureFetch(`/api/hubs/${hubId}/conversations`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ conversationId }),
        });

        if (!response.success) {
          setError(response.error);
          return false;
        }

        // Refresh hubs to get updated data
        await refreshHubs();
        return true;
      } catch (err) {
        setError("Failed to remove conversation from hub");
        return false;
      }
    },
    [secureFetch, refreshHubs],
  );

  useEffect(() => {
    fetchHubs();
  }, [fetchHubs]);

  const value: HubsContextType = {
    hubs,
    loading,
    error,
    createHub,
    updateHub,
    deleteHub,
    fetchHubs,
    getHub,
    refreshHubs,
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