// filepath: h:\Workspace\deni-ai\apps\www\hooks\use-chat-sessions.tsx
"use client";

import { UIMessage } from "ai";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Bot, BotWithId } from "@/types/bot";
import { supabase } from "@workspace/supabase-config/client";

interface ChatSessionsContextValue {
  sessions: ChatSession[];
  createSession: (bot?: BotWithId) => ChatSession;
  addSession: (session: ChatSession) => void;
  updateSession: (id: string, updatedSession: ChatSession) => Promise<void>;
  deleteSession: (id: string) => void;
  clearAllSessions: () => Promise<void>;
  getSession: (id: string) => ChatSession | undefined;
  syncSessions: () => Promise<void>;
  exportAllSessions: () => Promise<string>;
  importAllSessions: (jsonData: string) => Promise<void>;
  createBranchSession: (
    parentSession: ChatSession,
    branchName: string
  ) => ChatSession;
  createBranchFromMessage: (
    parentSession: ChatSession,
    messageId: string,
    branchName: string
  ) => ChatSession | undefined;
  isLoading: boolean;
  isSupabaseLoaded: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: UIMessage[];
  createdAt: Date;
  isBranch?: boolean;
  bot?: BotWithId;
  parentSessionId?: string;
  branchName?: string;
  hubId?: string;
}

const ChatSessionsContext = createContext<ChatSessionsContextValue | undefined>(
  undefined
);

// DB and store name for IndexedDB
const DB_NAME = "deni-ai-chat-db";
const DB_VERSION = 1;
const CHAT_SESSIONS_STORE = "chatSessions";
const CURRENT_CHAT_SESSION_KEY = "currentChatSession";

// Helper functions for IndexedDB operations
const initDatabase = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(CHAT_SESSIONS_STORE)) {
        const store = db.createObjectStore(CHAT_SESSIONS_STORE, {
          keyPath: "id",
        });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
  });
};

const saveSessionToIndexedDB = async (session: ChatSession): Promise<void> => {
  const db = await initDatabase();
  const transaction = db.transaction([CHAT_SESSIONS_STORE], "readwrite");
  const store = transaction.objectStore(CHAT_SESSIONS_STORE);
  store.put({
    ...session,
    createdAt: session.createdAt.getTime(), // Store as timestamp
  });
};

const loadSessionsFromIndexedDB = async (): Promise<ChatSession[]> => {
  try {
    const db = await initDatabase();
    const transaction = db.transaction([CHAT_SESSIONS_STORE], "readonly");
    const store = transaction.objectStore(CHAT_SESSIONS_STORE);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const sessions = request.result.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt), // Convert back to Date
        }));
        resolve(sessions);
      };
    });
  } catch (error) {
    console.error("Error loading sessions from IndexedDB:", error);
    return [];
  }
};

const deleteSessionFromIndexedDB = async (sessionId: string): Promise<void> => {
  const db = await initDatabase();
  const transaction = db.transaction([CHAT_SESSIONS_STORE], "readwrite");
  const store = transaction.objectStore(CHAT_SESSIONS_STORE);
  store.delete(sessionId);
};

const clearAllSessionsFromIndexedDB = async (): Promise<void> => {
  const db = await initDatabase();
  const transaction = db.transaction([CHAT_SESSIONS_STORE], "readwrite");
  const store = transaction.objectStore(CHAT_SESSIONS_STORE);
  store.clear();
};

export function ChatSessionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const t = useTranslations();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isSupabaseLoaded, setIsSupabaseLoaded] = useState(false);

  // Load sessions on component mount and when user changes
  useEffect(() => {
    const loadSessions = async () => {
      setIsLoading(true);
      setIsSupabaseLoaded(false);

      try {
        if (!isFirstLoad) {
          // Clear sessions on first load
          setIsLoading(false);  
          setIsSupabaseLoaded(true);
          return;
        }

        if (user) {
          // Load from Supabase for authenticated users
          if (!supabase) {
            throw new Error("Supabase client not initialized");
          }
          const { data, error } = await supabase
            .from("chat_sessions")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (error) {
            console.error("Error loading sessions from Supabase:", error);
            // Fallback to IndexedDB
            const localSessions = await loadSessionsFromIndexedDB();
            setSessions(localSessions);
          } else {
            const supabaseSessions: ChatSession[] = data.map(
              (session: any) => ({
                id: session.id,
                title: session.title,
                messages: session.messages || [],
                createdAt: new Date(session.created_at),
                isBranch: session.isBranch, // Default value since column doesn't exist yet
                bot: session.bot, // Default value since column doesn't exist yet
                parentSessionId: session.parentSessionId, // Default value since column doesn't exist yet
                branchName: session.branchName, // Default value since column doesn't exist yet
                hubId: session.hubId, // Default value since column doesn't exist yet
              })
            );
            setSessions(supabaseSessions);
            setIsSupabaseLoaded(true);
          }
        } else {
          // Load from IndexedDB for non-authenticated users
          const localSessions = await loadSessionsFromIndexedDB();
          setSessions(localSessions);
        }
      } catch (error) {
        console.error("Error loading sessions:", error);
        const localSessions = await loadSessionsFromIndexedDB();
        setSessions(localSessions);
      } finally {
        if (isFirstLoad) {
          setIsFirstLoad(false);
        }
        setIsLoading(false);
      }
    };

    loadSessions();
  }, [user]);

  useEffect(() => {
    console.log("Loading state changed:", isLoading);
  }, [isLoading]);

  const createSession = useCallback(
    (bot?: BotWithId): ChatSession => {
      const newSession: ChatSession = {
        id: crypto.randomUUID(),
        title: t("chatSessions.newChat"),
        messages: [],
        createdAt: new Date(),
        isBranch: false,
      };

      if (bot) {
        newSession.bot = bot;
      }

      setSessions((prev) => [newSession, ...prev]);

      // Save to appropriate storage based on authentication status
      if (user && supabase) {
        // Save to Supabase for authenticated users
        supabase
          .from("chat_sessions")
          .insert({
            id: newSession.id,
            user_id: user.id,
            title: newSession.title,
            messages: newSession.messages,
            bot: bot,
            created_at: newSession.createdAt.toISOString(),
          })
          .then(({ error }) => {
            if (error) {
              console.error("Error saving session to Supabase:", error);
              // Fallback to IndexedDB on error
              saveSessionToIndexedDB(newSession);
            }
          });
      } else {
        // Save to IndexedDB for non-authenticated users
        saveSessionToIndexedDB(newSession);
      }

      return newSession;
    },
    [t, user]
  );
  const createBranchSession = useCallback(
    (parentSession: ChatSession, branchName: string): ChatSession => {
      const newBranchSession: ChatSession = {
        ...parentSession,
        id: crypto.randomUUID(),
        title: `${parentSession.title} (${branchName})`,
        messages: [...parentSession.messages],
        createdAt: new Date(),
        isBranch: true,
        parentSessionId: parentSession.id,
        branchName,
      };

      setSessions((prev) => [newBranchSession, ...prev]);

      // Save to appropriate storage based on authentication status
      if (user && supabase) {
        // Save to Supabase for authenticated users
        supabase
          .from("chat_sessions")
          .insert({
            id: newBranchSession.id,
            user_id: user.id,
            title: newBranchSession.title,
            messages: newBranchSession.messages,
            created_at: newBranchSession.createdAt.toISOString(),
          })
          .then(({ error }) => {
            if (error) {
              console.error("Error saving branch session to Supabase:", error);
              // Fallback to IndexedDB on error
              saveSessionToIndexedDB(newBranchSession);
            }
          });
      } else {
        // Save to IndexedDB for non-authenticated users
        saveSessionToIndexedDB(newBranchSession);
      }

      toast.success(t("chatSessions.branchCreatedSuccess", { branchName }));

      return newBranchSession;
    },
    [t, user]
  );

  const createBranchFromMessage = useCallback(
    (
      parentSession: ChatSession,
      messageId: string,
      branchName: string
    ): ChatSession | undefined => {
      const messageIndex = parentSession.messages.findIndex(
        (msg) => msg.id === messageId
      );

      if (messageIndex === -1) {
        toast.error(t("chatSessions.messageNotFoundForBranch"));
        return undefined;
      }

      const messagesUpToPoint = parentSession.messages.slice(
        0,
        messageIndex + 1
      );

      const newBranchSession: ChatSession = {
        ...parentSession,
        id: crypto.randomUUID(),
        title: `${parentSession.title} (${branchName} - branched from message)`,
        messages: messagesUpToPoint,
        createdAt: new Date(),
        isBranch: true,
        parentSessionId: parentSession.id,
        branchName,
      };
      setSessions((prev) => [newBranchSession, ...prev]);

      // Save to appropriate storage based on authentication status
      if (user && supabase) {
        // Save to Supabase for authenticated users
        supabase
          .from("chat_sessions")
          .insert({
            id: newBranchSession.id,
            user_id: user.id,
            title: newBranchSession.title,
            messages: newBranchSession.messages,
            created_at: newBranchSession.createdAt.toISOString(),
          })
          .then(({ error }) => {
            if (error) {
              console.error(
                "Error saving branch session from message to Supabase:",
                error
              );
              // Fallback to IndexedDB on error
              saveSessionToIndexedDB(newBranchSession);
            }
          });
      } else {
        // Save to IndexedDB for non-authenticated users
        saveSessionToIndexedDB(newBranchSession);
      }

      toast.success(
        t("chatSessions.branchFromMessageCreatedSuccess", { branchName })
      );

      return newBranchSession;
    },
    [t, user]
  );
  const addSession = useCallback(
    (session: ChatSession) => {
      setSessions((prev) => [session, ...prev]);

      // Save to appropriate storage based on authentication status
      if (user && supabase) {
        // Save to Supabase for authenticated users
        supabase
          .from("chat_sessions")
          .insert({
            id: session.id,
            user_id: user.id,
            title: session.title,
            messages: session.messages,
            created_at: session.createdAt.toISOString(),
          })
          .then(({ error }) => {
            if (error) {
              console.error("Error adding session to Supabase:", error);
              // Fallback to IndexedDB on error
              saveSessionToIndexedDB(session);
            }
          });
      } else {
        // Save to IndexedDB for non-authenticated users
        saveSessionToIndexedDB(session);
      }
    },
    [user]
  );
  const updateSession = useCallback(
    async (id: string, updatedSession: ChatSession) => {
      setSessions((prev) =>
        prev.map((session) => (session.id === id ? updatedSession : session))
      );

      // Save to appropriate storage based on authentication status
      if (user && supabase) {
        // Save to Supabase for authenticated users
        try {
          const { error } = await supabase.from("chat_sessions").upsert({
            id: updatedSession.id,
            user_id: user.id,
            title: updatedSession.title,
            messages: updatedSession.messages,
            created_at: updatedSession.createdAt.toISOString(),
          });

          if (error) {
            console.error("Error updating session in Supabase:", error);
            // Fallback to IndexedDB on error
            await saveSessionToIndexedDB(updatedSession);
          }
        } catch (error) {
          console.error("Error updating session in Supabase:", error);
          // Fallback to IndexedDB on error
          await saveSessionToIndexedDB(updatedSession);
        }
      } else {
        // Save to IndexedDB for non-authenticated users
        await saveSessionToIndexedDB(updatedSession);
      }
    },
    [user]
  );
  const deleteSession = useCallback(
    async (id: string) => {
      setSessions((prev) => prev.filter((session) => session.id !== id));

      // Delete from appropriate storage based on authentication status
      if (user && supabase) {
        // Delete from Supabase for authenticated users
        try {
          const { error } = await supabase
            .from("chat_sessions")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);

          if (error) {
            console.error("Error deleting session from Supabase:", error);
            // Fallback to IndexedDB deletion on error
            await deleteSessionFromIndexedDB(id);
          }
        } catch (error) {
          console.error("Error deleting session from Supabase:", error);
          // Fallback to IndexedDB deletion on error
          await deleteSessionFromIndexedDB(id);
        }
      } else {
        // Delete from IndexedDB for non-authenticated users
        await deleteSessionFromIndexedDB(id);
      }

      toast.success(t("chatSessions.sessionDeletedSuccess"));
    },
    [user, t]
  );

  const clearAllSessions = useCallback(async () => {
    const clearPromise = async () => {
      setSessions([]);
      await clearAllSessionsFromIndexedDB();
      if (user) {
        try {
          if (!supabase) {
            throw new Error("Supabase client not initialized");
          }
          const { error } = await supabase
            .from("chat_sessions")
            .delete()
            .eq("user_id", user.id);

          if (error) {
            console.error("Error clearing sessions from Supabase:", error);
          }
        } catch (error) {
          console.error("Error clearing sessions from Supabase:", error);
        }
      }
    };

    toast.promise(clearPromise(), {
      loading: t("settings.popupMessages.deleteAllLoading"),
      success: t("settings.popupMessages.deleteAllSuccess"),
      error: t("settings.popupMessages.deleteAllError"),
    });
  }, [user, t]);

  const getSession = useCallback(
    (id: string) => sessions.find((session) => session.id === id),
    [sessions]
  );

  const syncSessions = useCallback(async () => {
    if (!user) return;
    try {
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      // Get local sessions
      const localSessions = await loadSessionsFromIndexedDB();

      // Get remote sessions
      const { data: remoteSessions, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error syncing sessions:", error);
        return;
      } // Upload local sessions that don't exist remotely
      const remoteIds = new Set(remoteSessions?.map((s: any) => s.id) || []);
      const sessionsToUpload = localSessions.filter(
        (s: ChatSession) => !remoteIds.has(s.id)
      );

      for (const session of sessionsToUpload) {
        const { error: uploadError } = await supabase
          .from("chat_sessions")
          .insert({
            id: session.id,
            user_id: user.id,
            title: session.title,
            messages: session.messages,
            created_at: session.createdAt.toISOString(),
          });

        if (uploadError) {
          console.error("Error uploading session:", uploadError);
        }
      } // Update local state with all sessions
      const allSessions: ChatSession[] = (remoteSessions || []).map(
        (session: any) => ({
          id: session.id,
          title: session.title,
          messages: session.messages || [],
          createdAt: new Date(session.created_at),
          isBranch: session.isBranch, // Default value since column doesn't exist yet
          bot: session.bot, // Default value since column doesn't exist yet
          parentSessionId: session.parentSessionId, // Default value since column doesn't exist yet
          branchName: session.branchName, // Default value since column doesn't exist yet
          hubId: session.hubId, // Default value since column doesn't exist yet
        })
      );

      setSessions(allSessions);
      toast.success(t("chatSessions.syncSuccess"));
    } catch (error) {
      console.error("Error syncing sessions:", error);
      toast.error(t("chatSessions.syncError"));
    }
  }, [user, t]);

  const exportAllSessions = useCallback(async (): Promise<string> => {
    try {
      const sessionsToExport =
        sessions.length > 0 ? sessions : await loadSessionsFromIndexedDB();
      const sessionsWithStringDate = sessionsToExport.map((s) => ({
        ...s,
        createdAt:
          s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
      }));
      return JSON.stringify(sessionsWithStringDate, null, 2);
    } catch (error) {
      console.error("Error exporting sessions:", error);
      throw error;
    }
  }, [sessions]);

  const importAllSessions = useCallback(
    async (jsonData: string): Promise<void> => {
      try {
        const parsedData = JSON.parse(jsonData);
        if (!Array.isArray(parsedData)) {
          throw new Error("Invalid format: Data is not an array.");
        }

        const importedSessions: ChatSession[] = parsedData.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
        }));

        // Clear existing sessions
        setSessions([]);
        await clearAllSessionsFromIndexedDB();
        if (user) {
          try {
            if (!supabase) {
              throw new Error("Supabase client not initialized");
            }

            // Clear existing remote sessions
            const { error: clearError } = await supabase
              .from("chat_sessions")
              .delete()
              .eq("user_id", user.id);

            if (clearError) {
              console.error("Error clearing remote sessions:", clearError);
            } // Insert imported sessions
            for (const session of importedSessions) {
              const { error: insertError } = await supabase
                .from("chat_sessions")
                .insert({
                  id: session.id,
                  user_id: user.id,
                  title: session.title,
                  messages: session.messages,
                  created_at: session.createdAt.toISOString(),
                });

              if (insertError) {
                console.error("Error importing session:", insertError);
              }
            }
          } catch (error) {
            console.error("Error importing to Supabase:", error);
          }
        }

        // Save to IndexedDB
        for (const session of importedSessions) {
          await saveSessionToIndexedDB(session);
        }

        setSessions(importedSessions);
        await syncSessions();
        toast.success(t("chatSessions.importSuccess"));
      } catch (error) {
        console.error("Error importing sessions:", error);
        toast.error(
          t("chatSessions.importError", {
            description: error instanceof Error ? error.message : String(error),
          })
        );
      }
    },
    [user, t, syncSessions]
  );

  const value: ChatSessionsContextValue = {
    sessions,
    createSession,
    addSession,
    updateSession,
    deleteSession,
    clearAllSessions,
    getSession,
    syncSessions,
    exportAllSessions,
    importAllSessions,
    createBranchSession,
    createBranchFromMessage,
    isLoading,
    isSupabaseLoaded,
  };

  return (
    <ChatSessionsContext.Provider value={value}>
      {children}
    </ChatSessionsContext.Provider>
  );
}

export function useChatSessions() {
  const context = useContext(ChatSessionsContext);
  if (context === undefined) {
    throw new Error(
      "useChatSessions must be used within a ChatSessionsProvider"
    );
  }
  return context;
}
