import { useState, useEffect, useCallback } from 'react';
import { Hub, HubFileReference } from '@/types/hub';
import { v4 as uuidv4 } from 'uuid';

const HUBS_STORAGE_KEY = 'hubs';

export interface UseHubsReturn {
  hubs: Hub[];
  getHub: (id: string) => Hub | undefined;
  createHub: (name: string, description?: string, customInstructions?: string) => Hub;
  updateHub: (id: string, updates: Partial<Omit<Hub, 'id' | 'createdAt' | 'chatSessionIds' | 'fileReferences'>>) => Hub | undefined;
  deleteHub: (id: string) => void;
  addChatSessionToHub: (hubId: string, chatSessionId: string) => Hub | undefined;
  removeChatSessionFromHub: (hubId: string, chatSessionId: string) => Hub | undefined;
  addFileToHub: (hubId: string, file: Omit<HubFileReference, 'id' | 'createdAt'>) => Hub | undefined;
  removeFileFromHub: (hubId: string, fileId: string) => Hub | undefined;
  updateFileInHub: (hubId: string, fileId: string, updates: Partial<Omit<HubFileReference, 'id' | 'createdAt'>>) => Hub | undefined;
  getHubsForChatSession: (chatSessionId: string) => Hub[];
}

export function useHubs(): UseHubsReturn {
  const [hubs, setHubs] = useState<Hub[]>([]);

  useEffect(() => {
    try {
      const storedHubs = localStorage.getItem(HUBS_STORAGE_KEY);
      if (storedHubs) {
        setHubs(JSON.parse(storedHubs));
      }
    } catch (error) {
      console.error("Failed to load hubs from localStorage:", error);
      setHubs([]); // Initialize with empty array on error
    }
  }, []);

  const saveHubs = useCallback((updatedHubs: Hub[]) => {
    try {
      localStorage.setItem(HUBS_STORAGE_KEY, JSON.stringify(updatedHubs));
      setHubs(updatedHubs);
    } catch (error) {
      console.error("Failed to save hubs to localStorage:", error);
      // Optionally, notify the user or revert to a previous state
    }
  }, []);

  const createHub = useCallback((name: string, description?: string, customInstructions?: string): Hub => {
    const newHub: Hub = {
      id: uuidv4(),
      name,
      description,
      customInstructions,
      chatSessionIds: [],
      fileReferences: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveHubs([...hubs, newHub]);
    return newHub;
  }, [hubs, saveHubs]);

  const getHub = useCallback((id: string): Hub | undefined => {
    return hubs.find(hub => hub.id === id);
  }, [hubs]);

  const updateHub = useCallback((id: string, updates: Partial<Omit<Hub, 'id' | 'createdAt' | 'chatSessionIds' | 'fileReferences'>>): Hub | undefined => {
    let updatedHub: Hub | undefined;
    const updatedHubs = hubs.map(hub => {
      if (hub.id === id) {
        updatedHub = { ...hub, ...updates, updatedAt: Date.now() };
        return updatedHub;
      }
      return hub;
    });
    if (updatedHub) {
      saveHubs(updatedHubs);
    }
    return updatedHub;
  }, [hubs, saveHubs]);

  const deleteHub = useCallback((id: string): void => {
    const updatedHubs = hubs.filter(hub => hub.id !== id);
    saveHubs(updatedHubs);
  }, [hubs, saveHubs]);

  const addChatSessionToHub = useCallback((hubId: string, chatSessionId: string): Hub | undefined => {
    let targetHub: Hub | undefined;
    const updatedHubs = hubs.map(hub => {
      if (hub.id === hubId) {
        if (!hub.chatSessionIds.includes(chatSessionId)) {
          targetHub = {
            ...hub,
            chatSessionIds: [...hub.chatSessionIds, chatSessionId],
            updatedAt: Date.now(),
          };
          return targetHub;
        }
      }
      return hub;
    });
    if (targetHub) {
      saveHubs(updatedHubs);
    }
    return targetHub;
  }, [hubs, saveHubs]);

  const removeChatSessionFromHub = useCallback((hubId: string, chatSessionId: string): Hub | undefined => {
    let targetHub: Hub | undefined;
    const updatedHubs = hubs.map(hub => {
      if (hub.id === hubId) {
        targetHub = {
          ...hub,
          chatSessionIds: hub.chatSessionIds.filter(id => id !== chatSessionId),
          updatedAt: Date.now(),
        };
        return targetHub;
      }
      return hub;
    });
    if (targetHub) {
      saveHubs(updatedHubs);
    }
    return targetHub;
  }, [hubs, saveHubs]);

  const addFileToHub = useCallback((hubId: string, fileData: Omit<HubFileReference, 'id' | 'createdAt'>): Hub | undefined => {
    let targetHub: Hub | undefined;
    const newFile: HubFileReference = {
      ...fileData,
      id: uuidv4(),
      createdAt: Date.now(),
    };
    const updatedHubs = hubs.map(hub => {
      if (hub.id === hubId) {
        targetHub = {
          ...hub,
          fileReferences: [...hub.fileReferences, newFile],
          updatedAt: Date.now(),
        };
        return targetHub;
      }
      return hub;
    });
    if (targetHub) {
      saveHubs(updatedHubs);
    }
    return targetHub;
  }, [hubs, saveHubs]);

  const removeFileFromHub = useCallback((hubId: string, fileId: string): Hub | undefined => {
    let targetHub: Hub | undefined;
    const updatedHubs = hubs.map(hub => {
      if (hub.id === hubId) {
        targetHub = {
          ...hub,
          fileReferences: hub.fileReferences.filter(file => file.id !== fileId),
          updatedAt: Date.now(),
        };
        return targetHub;
      }
      return hub;
    });
    if (targetHub) {
      saveHubs(updatedHubs);
    }
    return targetHub;
  }, [hubs, saveHubs]);

  const updateFileInHub = useCallback((hubId: string, fileId: string, updates: Partial<Omit<HubFileReference, 'id' | 'createdAt'>>): Hub | undefined => {
    let targetHub: Hub | undefined;
    const updatedHubs = hubs.map(hub => {
      if (hub.id === hubId) {
        targetHub = {
          ...hub,
          fileReferences: hub.fileReferences.map(file =>
            file.id === fileId ? { ...file, ...updates } : file
          ),
          updatedAt: Date.now(),
        };
        return targetHub;
      }
      return hub;
    });
    if (targetHub) {
      saveHubs(updatedHubs);
    }
    return targetHub;
  }, [hubs, saveHubs]);

  const getHubsForChatSession = useCallback((chatSessionId: string): Hub[] => {
    return hubs.filter(hub => hub.chatSessionIds.includes(chatSessionId));
  }, [hubs]);

  return {
    hubs,
    getHub,
    createHub,
    updateHub,
    deleteHub,
    addChatSessionToHub,
    removeChatSessionFromHub,
    addFileToHub,
    removeFileFromHub,
    updateFileInHub,
    getHubsForChatSession,
  };
}