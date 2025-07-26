"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { Conversation } from "@/lib/conversations";
import { supabase } from "@/lib/supabase/client";
import { ClientBot } from "@/lib/bot";
import { useSupabase } from "@/context/supabase-context";
interface ConversationsContextType {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  createConversation: (
    bot?: ClientBot,
    hubId?: string,
  ) => Promise<Conversation | null>;
  updateConversation: (
    id: string,
    data: Partial<Conversation>,
  ) => Promise<Conversation | null>;
  updateConversationTitle: (id: string, title: string) => Promise<boolean>;
  deleteConversation: (id: string) => Promise<boolean>;
  deleteAllConversations: () => Promise<boolean>;
  getConversation: (id: string) => Promise<Conversation | null>;
  refreshConversations: () => Promise<void>;
}

const ConversationsContext = createContext<
  ConversationsContextType | undefined
>(undefined);

interface ConversationsProviderProps {
  children: ReactNode;
}

export function ConversationsProvider({
  children,
}: ConversationsProviderProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useSupabase();

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching conversations:", error);
        setError("Failed to fetch conversations");
        return;
      }

      setConversations(data || []);
    } catch (err) {
      setError("Failed to fetch conversations");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createConversation = useCallback(
    async (bot?: ClientBot, hubId?: string): Promise<Conversation | null> => {
      if (!user) return null;
      
      setError(null);

      try {
        const { data, error } = await supabase
          .from("chat_sessions")
          .insert({
            user_id: user.id,
            title: "New Session",
            messages: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            bot,
            hub_id: hubId,
          })
          .select("*")
          .single();

        if (error) {
          console.error("Error creating conversation:", error);
          setError("Failed to create conversation");
          return null;
        }

        const newConversation = data;
        setConversations((prev) => [newConversation, ...prev]);
        return newConversation;
      } catch (err) {
        setError("Failed to create conversation");
        return null;
      }
    },
    [user],
  );

  const updateConversation = useCallback(
    async (
      id: string,
      updates: Partial<Conversation>,
    ): Promise<Conversation | null> => {
      setError(null);

      try {
        const { data, error } = await supabase
          .from("chat_sessions")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select("*")
          .single();

        if (error) {
          console.error("Error updating conversation:", error);
          setError("Failed to update conversation");
          return null;
        }

        const updatedConversation = data;
        setConversations((prev) =>
          prev.map((conv) => (conv.id === id ? updatedConversation : conv)),
        );
        return updatedConversation;
      } catch (err) {
        setError("Failed to update conversation");
        return null;
      }
    },
    [],
  );

  const updateConversationTitle = useCallback(
    async (id: string, title: string): Promise<boolean> => {
      setError(null);

      // This is a local update for apply title immediately in the UI, You don't need to call API for this.
      const updatedConversation = conversations.find((conv) => conv.id === id);
      if (!updatedConversation) {
        setError("Conversation not found");
        return false;
      }
      updatedConversation.title = title;
      setConversations((prev) =>
        prev.map((conv) => (conv.id === id ? updatedConversation : conv)),
      );
      return true;
    },
    [conversations],
  );

  const deleteConversation = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null);

      try {
        const { error } = await supabase
          .from("chat_sessions")
          .delete()
          .eq("id", id);

        if (error) {
          console.error("Error deleting conversation:", error);
          setError("Failed to delete conversation");
          return false;
        }

        setConversations((prev) => prev.filter((conv) => conv.id !== id));
        return true;
      } catch (err) {
        setError("Failed to delete conversation");
        return false;
      }
    },
    [],
  );

  const deleteAllConversations = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    
    setError(null);

    try {
      const { error } = await supabase
        .from("chat_sessions")
        .delete()
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting all conversations:", error);
        setError("Failed to delete all conversations");
        return false;
      }

      setConversations([]);
      return true;
    } catch (err) {
      setError("Failed to delete all conversations");
      return false;
    }
  }, [user]);

  const getConversation = useCallback(
    async (id: string): Promise<Conversation | null> => {
      setError(null);

      try {
        const { data, error } = await supabase
          .from("chat_sessions")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error("Error fetching conversation:", error);
          setError("Failed to get conversation");
          return null;
        }

        return data;
      } catch (err) {
        setError("Failed to get conversation");
        return null;
      }
    },
    [],
  );

  const refreshConversations = useCallback(async () => {
    await fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const value: ConversationsContextType = {
    conversations,
    loading,
    error,
    createConversation,
    updateConversation,
    updateConversationTitle,
    deleteConversation,
    deleteAllConversations,
    getConversation,
    refreshConversations,
  };

  return (
    <ConversationsContext.Provider value={value}>
      {children}
    </ConversationsContext.Provider>
  );
}

export function useConversations(): ConversationsContextType {
  const context = useContext(ConversationsContext);
  if (context === undefined) {
    throw new Error(
      "useConversations must be used within a ConversationsProvider",
    );
  }
  return context;
}
