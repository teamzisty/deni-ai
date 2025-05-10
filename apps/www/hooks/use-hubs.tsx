"use client";

import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { Hub, HubFileReference } from "@/types/hub";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useLocalStorage } from "./use-local-storage";
import { useChatSessions } from "./use-chat-sessions";
import { useAuth } from "@/context/AuthContext";

const LOCAL_STORAGE_KEY = "deni-ai-hubs";

interface HubsContextProps {
  hubs: Hub[];
  isLoading: boolean;
  getHub: (id: string) => Hub | undefined;
  createHub: (
    name: string,
    description?: string,
    customInstructions?: string,
  ) => string; // Returns hub ID
  updateHub: (id: string, updatedHub: Hub) => void;
  deleteHub: (id: string) => Promise<void>;
  addChatToHub: (hubId: string, chatSessionId: string) => Promise<void>;
  removeChatFromHub: (hubId: string, chatSessionId: string) => Promise<void>;
  addFileReferenceToHub: (
    hubId: string,
    fileName: string,
    fileType: string,
    filePath?: string,
    fileSize?: number
  ) => void;
  removeFileReferenceFromHub: (hubId: string, fileReferenceId: string) => void;
}

const HubsContext = createContext<HubsContextProps | undefined>(undefined);

export function useHubs() {
  const context = useContext(HubsContext);
  if (!context) {
    throw new Error("useHubs must be used within a HubsProvider");
  }
  return context;
}

export function HubsProvider({ children }: { children: ReactNode }) {
  const [hubs, setHubs] = useLocalStorage<Hub[]>(LOCAL_STORAGE_KEY, []);
  const [isLoading, setIsLoading] = useState(true);
  const { getSession, updateSession } = useChatSessions();
  const t = useTranslations();

  // Initialize Hubs
  useEffect(() => {
    // Check if the hubs array is initialized
    if (!Array.isArray(hubs)) {
      setHubs([]);
    }
    
    setIsLoading(false);
  }, [hubs, setHubs]);

  // Convert Hub type format from string timestamps to number if needed
  // This is useful for handling hubs created with different timestamp formats
  const normalizeHub = (hub: Hub): Hub => {
    return {
      ...hub,
      createdAt: typeof hub.createdAt === 'string' ? new Date(hub.createdAt).getTime() : hub.createdAt,
      updatedAt: typeof hub.updatedAt === 'string' ? new Date(hub.updatedAt).getTime() : hub.updatedAt,
    };
  };

  // Get a hub by ID
  const getHub = (id: string): Hub | undefined => {
    return hubs.find((hub: Hub) => hub.id === id);
  };

  // Create a new hub
  const createHub = (
    name: string,
    description?: string,
    customInstructions?: string,
  ): string => {
    const now = new Date().getTime();
    const newHub: Hub = {
      id: uuidv4(),
      name,
      description,
      customInstructions,
      chatSessionIds: [],
      fileReferences: [],
      createdAt: now,
      updatedAt: now,
    };

    setHubs((prev: Hub[]) => [...prev, newHub]);
    toast.success(t("Hubs.hubCreated"));
    return newHub.id;
  };

  // Update a hub
  const updateHub = (id: string, updatedHub: Hub) => {
    setHubs((prev: Hub[]) => 
      prev.map((hub: Hub) => 
        hub.id === id 
          ? { 
              ...updatedHub, 
              updatedAt: new Date().getTime()
            } 
          : hub
      )
    );
  };

  // Delete a hub
  const deleteHub = async (id: string): Promise<void> => {
    setHubs((prev: Hub[]) => prev.filter((hub: Hub) => hub.id !== id));
    
    // Note: The chats themselves are not deleted, only the reference to them in the hub
  };

  // Add a chat session to a hub
  const addChatToHub = async (hubId: string, chatSessionId: string): Promise<void> => {
    // Verify that the chat session exists
    const session = getSession(chatSessionId);
    if (!session) {
      toast.error(t("Hubs.chatSessionNotFound"));
      throw new Error("Chat session not found");
    }

    updateSession(chatSessionId, {
      ...session,
      hubId,
    });

    // Update the hub with the new chat session
    setHubs((prev: Hub[]) => prev.map((hub: Hub) => {
      if (hub.id === hubId) {
        // Check if chat is already in this hub
        if (hub.chatSessionIds.includes(chatSessionId)) {
          return hub; // No change needed
        }

        return {
          ...hub,
          chatSessionIds: [...hub.chatSessionIds, chatSessionId],
          updatedAt: new Date().getTime(),
        };
      }
      return hub;
    }));
  };

  // Remove a chat session from a hub
  const removeChatFromHub = async (hubId: string, chatSessionId: string): Promise<void> => {
    const session = getSession(chatSessionId);
    if (!session) {
      toast.error(t("Hubs.chatSessionNotFound"));
      throw new Error("Chat session not found");
    }

    updateSession(chatSessionId, {
      ...session,
      hubId: undefined,
    });

    setHubs((prev: Hub[]) => prev.map((hub: Hub) => {
      if (hub.id === hubId) {
        return {
          ...hub,
          chatSessionIds: hub.chatSessionIds.filter((id: string) => id !== chatSessionId),
          updatedAt: new Date().getTime(),
        };
      }
      return hub;
    }));
  };

  // Add a file reference to a hub
  const addFileReferenceToHub = (
    hubId: string,
    fileName: string,
    fileType: string,
    filePath?: string,
    fileSize?: number
  ): void => {
    const fileRef: HubFileReference = {
      id: uuidv4(),
      name: fileName,
      type: fileType,
      path: filePath,
      size: fileSize,
      createdAt: new Date().getTime(),
    };

    setHubs((prev: Hub[]) => prev.map((hub: Hub) => {
      if (hub.id === hubId) {
        return {
          ...hub,
          fileReferences: [...hub.fileReferences, fileRef],
          updatedAt: new Date().getTime(),
        };
      }
      return hub;
    }));

    toast.success(t("common.fileAdded"));
  };

  // Remove a file reference from a hub
  const removeFileReferenceFromHub = (hubId: string, fileReferenceId: string): void => {
    setHubs((prev: Hub[]) => prev.map((hub: Hub) => {
      if (hub.id === hubId) {
        return {
          ...hub,
          fileReferences: hub.fileReferences.filter((file: HubFileReference) => file.id !== fileReferenceId),
          updatedAt: new Date().getTime(),
        };
      }
      return hub;
    }));

    toast.success(t("common.fileRemoved"));
  };

  const value: HubsContextProps = {
    hubs,
    isLoading,
    getHub,
    createHub,
    updateHub,
    deleteHub,
    addChatToHub,
    removeChatFromHub,
    addFileReferenceToHub,
    removeFileReferenceFromHub,
  };

  return <HubsContext.Provider value={value}>{children}</HubsContext.Provider>;
}