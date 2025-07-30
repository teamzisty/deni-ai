"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  Conversation,
} from "@/lib/conversations";
import { ClientBot } from "@/lib/bot";
import { useAuth } from "@/context/auth-context";
import { trpc } from "@/trpc/client";

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
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const { data: conversationsData } =
    trpc.conversation.getConversations.useQuery();
  const { mutateAsync: createConversation } =
    trpc.conversation.createConversation.useMutation();
  const { mutateAsync: updateConversation } =
    trpc.conversation.updateConversation.useMutation();
  const { mutateAsync: deleteConversation } =
    trpc.conversation.deleteConversation.useMutation();
  const { mutateAsync: deleteAllConversations } =
    trpc.conversation.deleteAllConversations.useMutation();
  const { mutateAsync: getConversation } =
    trpc.conversation.getConversation.useMutation();
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchConversations = useCallback(async () => {
    if (!user || !conversationsData) return;

    setError(null);
    try {
      setConversations(conversationsData as unknown as Conversation[]);
      setIsLoadingConversations(false);
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setError("Failed to fetch conversations");
    }
  }, [user, conversationsData]);

  const createConversationFn = useCallback(
    async (bot?: ClientBot, hubId?: string): Promise<Conversation | null> => {
      if (!user) return null;

      setError(null);

      try {
        const newConversation = await createConversation({
          title: bot?.name || "New Conversation",
          botId: bot?.id || "",
          hubId: hubId || "",
        });
        if (!newConversation) {
          setError("Failed to create conversation");
          return null;
        }
        // Fetch conversations after creating a new one to ensure we have the latest data
        setConversations((prev) => [
          newConversation as unknown as Conversation,
          ...prev,
        ]);
        return newConversation as unknown as Conversation;
      } catch (err) {
        console.error("Error creating conversation:", err);
        setError("Failed to create conversation");
        return null;
      }
    },
    [user, createConversation, fetchConversations],
  );

  const updateConversationFn = useCallback(
    async (
      id: string,
      updates: Partial<Conversation>,
    ): Promise<Conversation | null> => {
      setError(null);

      try {
        const updatedConversation = (await updateConversation({
          id,
          title: updates.title || "",
        })) as unknown as Conversation;
        if (!updatedConversation) {
          setError("Failed to update conversation");
          return null;
        }

        setConversations((prev) =>
          prev.map((conv) => (conv.id === id ? updatedConversation : conv)),
        );
        return updatedConversation;
      } catch (err) {
        console.error("Error updating conversation:", err);
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

  const deleteConversationFn = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null);

      try {
        const success = await deleteConversation({ id });
        if (!success) {
          setError("Failed to delete conversation");
          return false;
        }

        setConversations((prev) => prev.filter((conv) => conv.id !== id));
        return true;
      } catch (err) {
        console.error("Error deleting conversation:", err);
        setError("Failed to delete conversation");
        return false;
      }
    },
    [],
  );

  const deleteAllConversationsFn = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    setError(null);

    try {
      const success = await deleteAllConversations();
      if (!success) {
        setError("Failed to delete all conversations");
        return false;
      }

      setConversations([]);
      return true;
    } catch (err) {
      console.error("Error deleting all conversations:", err);
      setError("Failed to delete all conversations");
      return false;
    }
  }, [user, deleteAllConversations]);

  const getConversationFn = useCallback(
    async (id: string): Promise<Conversation | null> => {
      setError(null);

      try {
        const conversation = await getConversation({ id });
        if (!conversation) {
          setError("Failed to get conversation");
          return null;
        }

        return conversation as unknown as Conversation;
      } catch (err) {
        console.error("Error fetching conversation:", err);
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
    loading: isLoadingConversations,
    error,
    createConversation: createConversationFn,
    updateConversation: updateConversationFn,
    updateConversationTitle,
    deleteConversation: deleteConversationFn,
    deleteAllConversations: deleteAllConversationsFn,
    getConversation: getConversationFn,
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
