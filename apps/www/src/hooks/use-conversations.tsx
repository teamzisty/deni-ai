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
interface ConversationsContextType {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  createConversation: (bot?: ClientBot, hubId?: string) => Promise<Conversation | null>;
  updateConversation: (
    id: string,
    data: Partial<Conversation>,
  ) => Promise<Conversation | null>;
  updateConversationTitle: (
    id: string,
    title: string,
  ) => Promise<boolean>;
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

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await secureFetch("/api/conversations");
      if (!result.success) {
        setError(result.error);
        return;
      }

      setConversations(result.data);
    } catch (err) {
      setError("Failed to fetch conversations");
    } finally {
      setLoading(false);
    }
  }, [secureFetch]);

  const createConversation =
    useCallback(async (bot?: ClientBot, hubId?: string): Promise<Conversation | null> => {
      setError(null);

      try {
        const response = await secureFetch("/api/conversations", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ bot, hub_id: hubId }),
        });

        if (!response.success) {
          setError(response.error);
          return null;
        }

        const newConversation = response.data;
        setConversations((prev) => [newConversation, ...prev]);
        return newConversation;
      } catch (err) {
        setError("Failed to create conversation");
        return null;
      }
    }, [secureFetch]);

  const updateConversation = useCallback(
    async (
      id: string,
      data: Partial<Conversation>,
    ): Promise<Conversation | null> => {
      setError(null);

      try {
        const response = await secureFetch("/api/conversations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id, ...data }),
        });

        if (!response.success) {
          setError(response.error);
          return null;
        }

        const updatedConversation = response.data;
        setConversations((prev) =>
          prev.map((conv) => (conv.id === id ? updatedConversation : conv)),
        );
        return updatedConversation;
      } catch (err) {
        setError("Failed to update conversation");
        return null;
      }
    },
    [secureFetch],
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
        const response = await secureFetch(`/api/conversations/${id}`, {
          method: "DELETE",
        });

        if (!response.success) {
          setError(response.error);
          return false;
        }

        setConversations((prev) => prev.filter((conv) => conv.id !== id));
        return true;
      } catch (err) {
        setError("Failed to delete conversation");
        return false;
      }
    },
    [secureFetch],
  );

  const deleteAllConversations = useCallback(async (): Promise<boolean> => {
    setError(null);

    try {
      const response = await secureFetch("/api/conversations", {
        method: "DELETE",
      });

      if (!response.success) {
        setError(response.error);
        return false;
      }

      setConversations([]);
      return true;
    } catch (err) {
      setError("Failed to delete all conversations");
      return false;
    }
  }, [secureFetch]);

  const getConversation = useCallback(
    async (id: string): Promise<Conversation | null> => {
      setError(null);

      try {
        const response = await secureFetch(`/api/conversations/${id}`);
        if (!response.success) {
          setError(response.error);
          return null;
        }

        return response.data;
      } catch (err) {
        setError("Failed to get conversation");
        return null;
      }
    },
    [secureFetch],
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
