"use client";

import { useEffect, useState, createContext, useContext, ReactNode, useCallback, useRef } from "react";
import { Hub, HubFileReference } from "@/types/hub";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useLocalStorage } from "./use-local-storage";
import { useChatSessions } from "./use-chat-sessions";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@workspace/supabase-config/client";

const LOCAL_STORAGE_KEY = "deni-ai-hubs";
const SUPABASE_TABLE = "hubs";
const DB_TIMEOUT_MS = 15000; // 15 seconds timeout for database operations

interface HubsContextProps {
  hubs: Hub[];
  isLoading: boolean;
  isSupabaseLoaded: boolean;
  getHub: (id: string) => Hub | undefined;
  createHub: (
    name: string,
    description?: string,
    customInstructions?: string,
  ) => Promise<string>; // Returns hub ID
  updateHub: (id: string, updatedHubData: Partial<Hub>) => Promise<void>;
  deleteHub: (id: string) => Promise<void>;
  addChatToHub: (hubId: string, chatSessionId: string) => Promise<void>;
  removeChatFromHub: (hubId: string, chatSessionId: string) => Promise<void>;
  addFileReferenceToHub: (
    hubId: string,
    fileName: string,
    fileType: string,
    filePath?: string,
    fileSize?: number
  ) => Promise<void>;
  removeFileReferenceFromHub: (hubId: string, fileReferenceId: string) => Promise<void>;
  syncHubs: () => Promise<void>;
  syncLocalHubsToSupabase: () => Promise<void>;
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
  const [hubs, setInternalHubs] = useLocalStorage<Hub[]>(LOCAL_STORAGE_KEY, []);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseLoaded, setIsSupabaseLoaded] = useState(false);
  const { getSession, updateSession: updateChatSession } = useChatSessions();
  const t = useTranslations();
  const { user } = useAuth();
  const [modifiedHubIds, setModifiedHubIds] = useState<Set<string>>(new Set());
  const [prevAuthState, setPrevAuthState] = useState<boolean>(false); // For login sync
  // Add a ref to track if an operation is in progress to prevent rapid isLoading toggles
  const operationInProgressRef = useRef<boolean>(false);

  // Wrapper for setIsLoading to prevent rapid toggling
  const setLoadingState = useCallback((loading: boolean) => {
    if (loading) {
      operationInProgressRef.current = true;
      setIsLoading(true);
    } else {
      // 直接falseに設定せず、タイマーを使って非同期処理の完了を確認
      setTimeout(() => {
        // loading=falseを設定するときは、常にフラグをfalseにする
        // 他の処理が開始している場合は別途trueに設定されるため、ここは常にfalseにして問題ない
        operationInProgressRef.current = false;
        setIsLoading(false);
      }, 50);
    }
  }, []); // 空の依存配列に変更（setIsLoading は安定しているため）

  const setHubs = useCallback((newHubs: Hub[] | ((prevState: Hub[]) => Hub[])) => {
    setInternalHubs(prevInternalHubs => {
      const updatedHubs = typeof newHubs === 'function' ? newHubs(prevInternalHubs) : newHubs;
      // Ensure all hubs have valid timestamps after any update
      return updatedHubs.map(h => normalizeHubTimestampProperties(h, true));
    });
  }, [setInternalHubs]);

  const normalizeHubTimestampProperties = (hubData: any, ensureCurrentTime = false): Hub => {
    const now = new Date().getTime();
    const id = hubData.id || uuidv4(); // Ensure ID exists

    // Provide defaults for all required Hub fields
    const defaults: Omit<Hub, 'id' | 'createdAt' | 'updatedAt' | 'fileReferences' | 'chatSessionIds'> = {
      name: '',
      description: '',
      customInstructions: '',
    };

    const normalized = {
      ...defaults, // Apply defaults first
      ...hubData,    // Spread potentially incomplete hubData
      id,            // Ensure id is correctly set
      createdAt: typeof hubData.createdAt === 'string' || typeof hubData.createdAt === 'number' ? new Date(hubData.createdAt).getTime() : (ensureCurrentTime ? now : now),
      updatedAt: typeof hubData.updatedAt === 'string' || typeof hubData.updatedAt === 'number' ? new Date(hubData.updatedAt).getTime() : (ensureCurrentTime ? now : now),
      fileReferences: Array.isArray(hubData.fileReferences) ? hubData.fileReferences.map((fr: any) => ({
        id: fr.id || uuidv4(),
        name: fr.name || '',
        type: fr.type || '',
        path: fr.path || '',
        size: fr.size || 0,
        createdAt: typeof fr.createdAt === 'string' || typeof fr.createdAt === 'number' ? new Date(fr.createdAt).getTime() : (ensureCurrentTime ? now : now),
      })) : [],
      chatSessionIds: Array.isArray(hubData.chatSessionIds) ? hubData.chatSessionIds : [],
    };

    // Final check for required fields to satisfy Hub type
    if (typeof normalized.createdAt !== 'number') normalized.createdAt = now;
    if (typeof normalized.updatedAt !== 'number') normalized.updatedAt = now;
    if (!Array.isArray(normalized.chatSessionIds)) normalized.chatSessionIds = [];
    if (!Array.isArray(normalized.fileReferences)) normalized.fileReferences = [];

    return normalized as Hub;
  };
  
  const hubToSupabaseData = (hub: Hub): any => {
    const data = {
      ...hub,
      uid: user?.id || '',
      created_at: new Date(hub.createdAt).toISOString(),
      updated_at: new Date(hub.updatedAt).toISOString(),
      file_references: hub.fileReferences.map(fr => ({
        ...fr,
        created_at: new Date(fr.createdAt).toISOString(),
      })),
      chat_session_ids: hub.chatSessionIds,
      custom_instructions: hub.customInstructions,
    };
    // Remove undefined properties
    Object.keys(data).forEach(key => {
      if ((data as any)[key] === undefined) {
        delete (data as any)[key];
      }
    });
    return data;
  };  const loadHubsFromSupabase = useCallback(async () => {
    if (!user || !supabase) {
      setIsSupabaseLoaded(true);
      setLoadingState(false);
      return;
    }
    setLoadingState(true);
    try {
      const { data, error } = await supabase
        .from(SUPABASE_TABLE)
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      const loadedHubs: Hub[] = (data || []).map((item: any) => normalizeHubTimestampProperties({
        id: item.id,
        name: item.name,
        description: item.description,
        customInstructions: item.custom_instructions,
        chatSessionIds: item.chat_session_ids || [],
        fileReferences: (item.file_references || []).map((fr: any) => ({
          id: fr.id,
          name: fr.name,
          type: fr.type,
          path: fr.path,
          size: fr.size,
          createdAt: fr.created_at,
        })),
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }, true));
      
      setHubs(loadedHubs);
      setIsSupabaseLoaded(true);
    } catch (error: any) {
      console.error("Failed to load hubs from Supabase:", error);
      const errorMessage = error.message && error.message.includes('timed out')
        ? t("Hubs.Error.loadFailedTimeout")
        : t("Hubs.Error.loadFailed");
      toast.error(errorMessage);
      // Fallback to local storage if Supabase fails but user is logged in
      const localHubsRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
      const localHubs = localHubsRaw ? (JSON.parse(localHubsRaw) as Hub[]).map(h => normalizeHubTimestampProperties(h, true)) : [];
      setHubs(localHubs);
      setIsSupabaseLoaded(true); // Still set to true as we attempted
    } finally {
      setLoadingState(false);
    }
  }, [user, t, setHubs]);
  useEffect(() => {
    if (user) {
      // If user is logged in, prioritize Supabase, then sync local changes if any.
      loadHubsFromSupabase()
    } else {
      // User logged out or not yet loaded, use local storage
      const localHubsRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
      const localHubs = localHubsRaw ? (JSON.parse(localHubsRaw) as Hub[]).map(h => normalizeHubTimestampProperties(h, true)) : [];
      setHubs(localHubs);
      setLoadingState(false);
      setIsSupabaseLoaded(true); // Considered "loaded" from local
    }
  }, [user]);  const saveHubsToStorage = useCallback(async (hubsToSave: Hub[], specificIds?: Set<string>) => {
    const idsToSave = specificIds || modifiedHubIds;
    if (idsToSave.size === 0 && !specificIds) return; // Nothing to save unless specific IDs are provided
    
    if (user && supabase) {
      // Save to Supabase
      console.log("Saving hubs to Supabase...");
      setLoadingState(true);      try {
        for (const hub of hubsToSave) {
          if (idsToSave.has(hub.id)) {
            const hubData = hubToSupabaseData(normalizeHubTimestampProperties(hub, true));
            if (!supabase) {
              throw new Error('Supabase client not available');
            }
            const { error } = await supabase
              .from(SUPABASE_TABLE)
              .upsert(hubData, { onConflict: 'id' });
            
            if (error) {
              throw error;
            }
          }
        }
        
        // 成功した場合だけmodifiedHubIdsを更新
        setModifiedHubIds(prev => {
          const next = new Set(prev);
          idsToSave.forEach(id => next.delete(id));
          return next;
        });
      } catch (error: any) {
        console.error("Failed to save hubs to Supabase:", error);
        const errorMessage = error.message && error.message.includes('timed out')
        ? t("Hubs.Error.saveFailedTimeout")
        : t("Hubs.Error.saveFailed");
        toast.error(errorMessage);
        // Fallback to local storage if Supabase save fails
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(hubsToSave.map(h => normalizeHubTimestampProperties(h, true))));
      } finally {
        setLoadingState(false);
      }
    } else {
      // Save to Local Storage
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(hubsToSave.map(h => normalizeHubTimestampProperties(h, true))));
    }
  }, [user, t, modifiedHubIds, setLoadingState]);


  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (modifiedHubIds.size > 0) {
        saveHubsToStorage(hubs, modifiedHubIds);
      }
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(debounceTimeout);
  }, [hubs, modifiedHubIds, saveHubsToStorage]);

  const syncLocalHubsToSupabase = useCallback(async (localHubsToSync?: Hub[]) => {
    if (!user) {
      setLoadingState(false);
      return;
    }
    const hubsToProcess = localHubsToSync || (JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]") as Hub[]).map(h => normalizeHubTimestampProperties(h,true));

    if (hubsToProcess.length === 0) {
      setLoadingState(false);
      return;
    }

    console.log("Syncing local hubs to Supabase...");
    setLoadingState(true);    try {
      // Get current Supabase hubs to avoid overwriting newer data or creating duplicates by ID
      if (!supabase) {
        throw new Error('Supabase client not available');
      }
      const { data: supabaseHubs, error: fetchError } = await supabase
        .from(SUPABASE_TABLE)
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) {
        throw fetchError;
      }

      const supabaseHubsMap = new Map(
        (supabaseHubs || []).map((item: any) => 
          [item.id, normalizeHubTimestampProperties({
            id: item.id,
            name: item.name,
            description: item.description,
            customInstructions: item.custom_instructions,
            chatSessionIds: item.chat_session_ids || [],
            fileReferences: (item.file_references || []).map((fr: any) => ({
              id: fr.id,
              name: fr.name,
              type: fr.type,
              path: fr.path,
              size: fr.size,
              createdAt: fr.created_at,
            })),
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          }, true)] as [string, Hub]
        )
      );

      let changesMade = false;
      for (const localHub of hubsToProcess) {
        const supabaseHub = supabaseHubsMap.get(localHub.id);
        if (supabaseHub) {          // Hub exists in Supabase, only update if local is newer
          if (localHub.updatedAt > supabaseHub.updatedAt) {
            const hubData = hubToSupabaseData(localHub);
            if (!supabase) {
              throw new Error('Supabase client not available');
            }
            const { error } = await supabase
              .from(SUPABASE_TABLE)
              .upsert(hubData, { onConflict: 'id' });
            
            if (error) throw error;
            changesMade = true;
          }        } else {
          // Hub does not exist in Supabase, add it
          const hubData = hubToSupabaseData(localHub);
          if (!supabase) {
            throw new Error('Supabase client not available');
          }
          const { error } = await supabase
            .from(SUPABASE_TABLE)
            .insert(hubData);
          
          if (error) throw error;
          changesMade = true;
        }
      }
      
      // 読み込み成功したらリロード
      if (changesMade) {
        await loadHubsFromSupabase();
      }
    } catch (error: any) {
      console.error("Failed to sync local hubs to Supabase:", error);
      const errorMessage = error.message && error.message.includes('timed out')
        ? t("Hubs.Error.syncFailedTimeout")
        : t("Hubs.Error.syncFailed");
      toast.error(errorMessage);
    } finally {
      setLoadingState(false);
    }
  }, [user, t, loadHubsFromSupabase, setLoadingState]);

  const syncHubs = useCallback(async () => {
    if (!user) {
      toast.error(t("Hubs.Error.syncNoUser"));
      setLoadingState(false);
      return;
    }

    console.log("Syncing hubs...");
    setLoadingState(true);
    try {
      // 1. Get local hubs
      const localHubsRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
      const localHubs: Hub[] = localHubsRaw ? (JSON.parse(localHubsRaw) as Hub[]).map(h => normalizeHubTimestampProperties(h, true)) : [];      // 2. Get Supabase hubs
      if (!supabase) {
        throw new Error('Supabase client not available');
      }
      const { data: supabaseData, error: fetchError } = await supabase
        .from(SUPABASE_TABLE)
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) {
        throw fetchError;
      }

      const supabaseHubs: Hub[] = (supabaseData || []).map((item: any) => normalizeHubTimestampProperties({
        id: item.id,
        name: item.name,
        description: item.description,
        customInstructions: item.custom_instructions,
        chatSessionIds: item.chat_session_ids || [],
        fileReferences: (item.file_references || []).map((fr: any) => ({
          id: fr.id,
          name: fr.name,
          type: fr.type,
          path: fr.path,
          size: fr.size,
          createdAt: fr.created_at,
        })),
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }, true));

      const supabaseHubsMap = new Map(supabaseHubs.map((h: Hub) => [h.id, h]));

      // 3. Merge and Sync
      const finalHubs: Hub[] = [];
      const allHubIds = new Set([...localHubs.map((h: Hub) => h.id), ...supabaseHubs.map((h: Hub) => h.id)]);

      for (const id of allHubIds) {
        const localHub = localHubs.find(h => h.id === id);
        const supabaseHub = supabaseHubsMap.get(id);

        if (localHub && supabaseHub) {
          // Hub exists in both: use the one with the later updatedAt timestamp
          const hubToKeep = localHub.updatedAt >= supabaseHub.updatedAt ? localHub : supabaseHub;
          finalHubs.push(normalizeHubTimestampProperties(hubToKeep, true));          // If the chosen hub is different from what's in Supabase or needs an update
          if (hubToKeep.updatedAt > (supabaseHub.updatedAt || 0) || hubToKeep !== supabaseHub) {
            const hubData = hubToSupabaseData(normalizeHubTimestampProperties(hubToKeep, true));
            if (!supabase) {
              throw new Error('Supabase client not available');
            }
            const { error } = await supabase
              .from(SUPABASE_TABLE)
              .upsert(hubData, { onConflict: 'id' });
            
            if (error) throw error;
          }        } else if (localHub) {
          // Hub only in local: add to Supabase
          finalHubs.push(normalizeHubTimestampProperties(localHub, true));
          const hubData = hubToSupabaseData(normalizeHubTimestampProperties(localHub, true));
          if (!supabase) {
            throw new Error('Supabase client not available');
          }
          const { error } = await supabase
            .from(SUPABASE_TABLE)
            .upsert(hubData, { onConflict: 'id' });
          
          if (error) throw error;
        } else if (supabaseHub) {
          // Hub only in Supabase: add to local list (already fetched)
          finalHubs.push(normalizeHubTimestampProperties(supabaseHub, true));
        }
      }
      
      const normalizedFinalHubs = finalHubs.map(h => normalizeHubTimestampProperties(h, true));
      setHubs(normalizedFinalHubs);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalizedFinalHubs)); // Update local storage with merged
      
      // 同期完了後にロードフラグをクリア
      setModifiedHubIds(new Set()); // 同期後に変更済みIDをリセット
    } catch (error: any) {
      console.error("Failed to sync hubs:", error);
      const errorMessage = error.message && error.message.includes('timed out')
        ? t("Hubs.Error.syncFailedTimeout") // Specific timeout message
        : t("Hubs.Error.syncFailed");
      toast.error(errorMessage);
    } finally {
      setLoadingState(false);
    }
  }, [user, t, setHubs, setLoadingState]);

  // Sync on login
  useEffect(() => {
    const currentAuthState = !!user;
    if (currentAuthState && !prevAuthState) {
      syncHubs(); // Full two-way sync on login
    }
    setPrevAuthState(currentAuthState);
  }, [user, prevAuthState, syncHubs]);


  // Get a hub by ID
  const getHub = (id: string): Hub | undefined => {
    const foundHub = hubs.find((hub: Hub) => hub.id === id);
    return foundHub ? normalizeHubTimestampProperties(foundHub, true) : undefined;
  };

  // Create a new hub
  const createHub = async (
    name: string,
    description?: string,
    customInstructions?: string,
  ): Promise<string> => {
    const now = new Date().getTime();
    const newHub: Hub = {
      id: uuidv4(),
      name,
      description: description || "",
      customInstructions: customInstructions || "",
      chatSessionIds: [],
      fileReferences: [],
      createdAt: now,
      updatedAt: now,
    };

    const updatedHubs = [...hubs, normalizeHubTimestampProperties(newHub, true)];
    setHubs(updatedHubs);
    setModifiedHubIds(prev => new Set(prev).add(newHub.id));
    
    // No immediate saveHubsToStorage call here, debouncer will handle it.
    return newHub.id;
  };

  // Update a hub
  const updateHub = async (id: string, updatedHubData: Partial<Hub>) => {
    let targetHub = hubs.find(hub => hub.id === id);
    if (!targetHub) {
        toast.error(t("Hubs.Error.notFound"));
        throw new Error("Hub not found");
    }

    const updatedHub = normalizeHubTimestampProperties({
        ...targetHub,
        ...updatedHubData,
        updatedAt: new Date().getTime(),
    }, true);
    
    const updatedHubs = hubs.map(hub => hub.id === id ? updatedHub : normalizeHubTimestampProperties(hub, true));
    setHubs(updatedHubs);
    setModifiedHubIds(prev => new Set(prev).add(id));
  };
  // Delete a hub
  const deleteHub = async (id: string): Promise<void> => {
    const hubToDelete = hubs.find(hub => hub.id === id);
    if (!hubToDelete) return; // Hub already deleted or never existed

    const updatedHubs = hubs.filter((hub: Hub) => hub.id !== id).map(h => normalizeHubTimestampProperties(h, true));
    setHubs(updatedHubs);
    // No setModifiedHubIds for delete, as it's a removal.    // Supabase specific delete:
    if (user && supabase) {
      try {
        const { error } = await supabase
          .from(SUPABASE_TABLE)
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
        
        if (error) throw error;
        toast.success(t("Hubs.deleted"));
      } catch (error) {
        console.error("Failed to delete hub from Supabase:", error);
        toast.error(t("Hubs.Error.deleteFailed"));
        // If Supabase delete fails, re-add to local state to maintain consistency with potential backend state
        setHubs(prevHubs => [...prevHubs, normalizeHubTimestampProperties(hubToDelete, true)].sort((a, b) => b.updatedAt - a.updatedAt));
      }
    } else {
        // Update local storage immediately for deletes if not logged in
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedHubs));
        toast.success(t("Hubs.deleted"));
    }
  };

  // Add a chat session to a hub
  const addChatToHub = async (hubId: string, chatSessionId: string): Promise<void> => {
    const session = getSession(chatSessionId);
    if (!session) {
      toast.error(t("Hubs.chatSessionNotFound"));
      throw new Error("Chat session not found");
    }

    const hub = hubs.find(h => h.id === hubId);
    if (!hub) {
      toast.error(t("Hubs.Error.notFound"));
      throw new Error("Hub not found");
    }

    const normalizedHub = normalizeHubTimestampProperties(hub, true);

    if (normalizedHub.chatSessionIds.includes(chatSessionId)) {
      return; // Already exists
    }

    const updatedHub = {
      ...normalizedHub,
      chatSessionIds: [...normalizedHub.chatSessionIds, chatSessionId],
      updatedAt: new Date().getTime(),
    };

    await updateChatSession(chatSessionId, { ...session, hubId });
    
    const updatedHubs = hubs.map(h => h.id === hubId ? normalizeHubTimestampProperties(updatedHub, true) : normalizeHubTimestampProperties(h, true));
    setHubs(updatedHubs);
    setModifiedHubIds(prev => new Set(prev).add(hubId));
  };

  // Remove a chat session from a hub
  const removeChatFromHub = async (hubId: string, chatSessionId: string): Promise<void> => {
    const session = getSession(chatSessionId);
    // No error if session not found, as it might have been deleted independently.

    const hub = hubs.find(h => h.id === hubId);
    if (!hub) {
      toast.error(t("Hubs.Error.notFound"));
      throw new Error("Hub not found");
    }
    const normalizedHub = normalizeHubTimestampProperties(hub, true);

    const updatedHub = {
      ...normalizedHub,
      chatSessionIds: normalizedHub.chatSessionIds.filter((id: string) => id !== chatSessionId),
      updatedAt: new Date().getTime(),
    };
    
    if (session) {
        await updateChatSession(chatSessionId, { ...session, hubId: undefined });
    }
    
    const updatedHubs = hubs.map(h => h.id === hubId ? normalizeHubTimestampProperties(updatedHub, true) : normalizeHubTimestampProperties(h, true));
    setHubs(updatedHubs);
    setModifiedHubIds(prev => new Set(prev).add(hubId));
  };

  // Add a file reference to a hub
  const addFileReferenceToHub = async (
    hubId: string,
    fileName: string,
    fileType: string,
    filePath?: string,
    fileSize?: number
  ): Promise<void> => {
    const hub = hubs.find(h => h.id === hubId);
    if (!hub) {
      toast.error(t("Hubs.Error.notFound"));
      throw new Error("Hub not found");
    }
    const normalizedHub = normalizeHubTimestampProperties(hub, true);

    const fileRef: HubFileReference = {
      id: uuidv4(),
      name: fileName,
      type: fileType,
      path: filePath || "",
      size: fileSize || 0,
      createdAt: new Date().getTime(),
    };

    const updatedHub = {
      ...normalizedHub,
      fileReferences: [...normalizedHub.fileReferences, normalizeHubTimestampProperties(fileRef, true) as unknown as HubFileReference], // Ensure fileRef is also normalized
      updatedAt: new Date().getTime(),
    };
    
    const updatedHubs = hubs.map(h => h.id === hubId ? normalizeHubTimestampProperties(updatedHub, true) : normalizeHubTimestampProperties(h, true));
    setHubs(updatedHubs);
    setModifiedHubIds(prev => new Set(prev).add(hubId));
    toast.success(t("common.fileAdded"));
  };

  // Remove a file reference from a hub
  const removeFileReferenceFromHub = async (hubId: string, fileReferenceId: string): Promise<void> => {
    const hub = hubs.find(h => h.id === hubId);
    if (!hub) {
      toast.error(t("Hubs.Error.notFound"));
      throw new Error("Hub not found");
    }
    const normalizedHub = normalizeHubTimestampProperties(hub, true);
    
    const updatedHub = {
      ...normalizedHub,
      fileReferences: normalizedHub.fileReferences.filter((file: HubFileReference) => file.id !== fileReferenceId),
      updatedAt: new Date().getTime(),
    };

    const updatedHubs = hubs.map(h => h.id === hubId ? normalizeHubTimestampProperties(updatedHub, true) : normalizeHubTimestampProperties(h, true));
    setHubs(updatedHubs);
    setModifiedHubIds(prev => new Set(prev).add(hubId));
    toast.success(t("common.fileRemoved"));
  };
  const value: HubsContextProps = {
    hubs,
    isLoading,
    isSupabaseLoaded,
    getHub,
    createHub,
    updateHub,
    deleteHub,
    addChatToHub,
    removeChatFromHub,
    addFileReferenceToHub,
    removeFileReferenceFromHub,
    syncHubs,
    syncLocalHubsToSupabase,
  };

  return <HubsContext.Provider value={value}>{children}</HubsContext.Provider>;
}