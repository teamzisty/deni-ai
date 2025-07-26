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
import { useSupabase } from "@/context/supabase-context";

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
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useSupabase();

  const fetchHubs = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data: hubsData, error } = await supabase
        .from("hubs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Supabase error:", error);
        setError("Failed to fetch hubs");
        return;
      }

      const hubs: Hub[] = [];

      for (const hub of hubsData || []) {
        hubs.push({
          id: hub.id,
          name: hub.name,
          description: hub.description,
          files: hub.files || [],
          conversations: hub.conversations || [],
          created_by: {
            name: user.user_metadata?.full_name || user.email || "Unknown User",
            verified: user.email_confirmed_at !== null,
            id: user.id,
          },
          created_at: new Date(hub.created_at).getTime(),
        });
      }

      setHubs(hubs);
    } catch (err) {
      setError("Failed to fetch hubs");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createHub = useCallback(
    async (name: string, description: string): Promise<Hub | null> => {
      if (!user || !name.trim() || !description.trim()) return null;
      
      setError(null);

      try {
        // Create hub id (random UUID)
        const hubId = crypto.randomUUID();

        // Save hub data to Supabase
        const { data, error } = await supabase.from("hubs").insert({
          id: hubId,
          name,
          description,
          user_id: user.id,
          files: [],
          conversations: [],
          created_at: new Date().toISOString(),
        }).select("*").single();

        if (error) {
          console.error("Supabase error:", error);
          setError("Failed to create hub");
          return null;
        }

        const newHub: Hub = {
          id: data.id,
          name: data.name,
          description: data.description,
          files: data.files || [],
          conversations: data.conversations || [],
          created_by: {
            name: user.user_metadata?.full_name || user.email || "Unknown User",
            verified: user.email_confirmed_at !== null,
            id: user.id,
          },
          created_at: new Date(data.created_at).getTime(),
        };

        setHubs((prev) => [newHub, ...prev]);
        return newHub;
      } catch (err) {
        setError("Failed to create hub");
        return null;
      }
    },
    [user],
  );

  const updateHub = useCallback(
    async (id: string, updates: Partial<Hub>): Promise<Hub | null> => {
      if (!user) return null;
      
      setError(null);

      try {
        const { data, error } = await supabase
          .from("hubs")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .eq("user_id", user.id) // Ensure user owns the hub
          .select("*")
          .single();

        if (error) {
          console.error("Supabase error:", error);
          setError("Failed to update hub");
          return null;
        }

        const updatedHub: Hub = {
          id: data.id,
          name: data.name,
          description: data.description,
          files: data.files || [],
          conversations: data.conversations || [],
          created_by: {
            name: user.user_metadata?.full_name || user.email || "Unknown User",
            verified: user.email_confirmed_at !== null,
            id: user.id,
          },
          created_at: new Date(data.created_at).getTime(),
        };

        setHubs((prev) =>
          prev.map((hub) => (hub.id === id ? updatedHub : hub)),
        );
        return updatedHub;
      } catch (err) {
        setError("Failed to update hub");
        return null;
      }
    },
    [user],
  );

  const deleteHub = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false;
      
      setError(null);

      try {
        const { error } = await supabase
          .from("hubs")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id); // Ensure user owns the hub

        if (error) {
          console.error("Supabase error:", error);
          setError("Failed to delete hub");
          return false;
        }

        setHubs((prev) => prev.filter((hub) => hub.id !== id));
        return true;
      } catch (err) {
        setError("Failed to delete hub");
        return false;
      }
    },
    [user],
  );

  const getHub = useCallback(
    async (id: string): Promise<Hub | null> => {
      if (!user) return null;
      
      setError(null);

      try {
        const { data, error } = await supabase
          .from("hubs")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error("Supabase error:", error);
          setError("Failed to get hub");
          return null;
        }

        const hub: Hub = {
          id: data.id,
          name: data.name,
          description: data.description,
          files: data.files || [],
          conversations: data.conversations || [],
          created_by: {
            name: user.user_metadata?.full_name || user.email || "Unknown User",
            verified: user.email_confirmed_at !== null,
            id: user.id,
          },
          created_at: new Date(data.created_at).getTime(),
        };

        return hub;
      } catch (err) {
        setError("Failed to get hub");
        return null;
      }
    },
    [user],
  );

  const refreshHubs = useCallback(async () => {
    await fetchHubs();
  }, [fetchHubs]);

  const addConversationToHub = useCallback(
    async (hubId: string, conversationId: string): Promise<boolean> => {
      if (!user) return false;
      
      setError(null);

      try {
        // First get the current hub to get its conversations array
        const { data: hubData, error: fetchError } = await supabase
          .from("hubs")
          .select("conversations")
          .eq("id", hubId)
          .eq("user_id", user.id)
          .single();

        if (fetchError) {
          console.error("Supabase error:", fetchError);
          setError("Failed to add conversation to hub");
          return false;
        }

        const currentConversations = hubData.conversations || [];
        
        // Check if conversation is already in the hub
        if (currentConversations.includes(conversationId)) {
          return true; // Already added
        }

        // Add the conversation to the array
        const updatedConversations = [...currentConversations, conversationId];

        const { error: updateError } = await supabase
          .from("hubs")
          .update({ 
            conversations: updatedConversations,
            updated_at: new Date().toISOString(),
          })
          .eq("id", hubId)
          .eq("user_id", user.id);

        if (updateError) {
          console.error("Supabase error:", updateError);
          setError("Failed to add conversation to hub");
          return false;
        }

        // Refresh hubs to get updated data
        await refreshHubs();
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
    [user, refreshHubs],
  );

  const removeConversationFromHub = useCallback(
    async (hubId: string, conversationId: string): Promise<boolean> => {
      if (!user) return false;
      
      setError(null);

      try {
        // First get the current hub to get its conversations array
        const { data: hubData, error: fetchError } = await supabase
          .from("hubs")
          .select("conversations")
          .eq("id", hubId)
          .eq("user_id", user.id)
          .single();

        if (fetchError) {
          console.error("Supabase error:", fetchError);
          setError("Failed to remove conversation from hub");
          return false;
        }

        const currentConversations = hubData.conversations || [];
        
        // Remove the conversation from the array
        const updatedConversations = currentConversations.filter(
          (id: string) => id !== conversationId
        );

        const { error: updateError } = await supabase
          .from("hubs")
          .update({ 
            conversations: updatedConversations,
            updated_at: new Date().toISOString(),
          })
          .eq("id", hubId)
          .eq("user_id", user.id);

        if (updateError) {
          console.error("Supabase error:", updateError);
          setError("Failed to remove conversation from hub");
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
    [user, refreshHubs],
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
