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
import {
  supabase,
} from "@workspace/supabase-config/client";

interface IntellipulseSessionsContextValue {
  sessions: IntellipulseSession[];
  createSession: () => IntellipulseSession;
  addSession: (session: IntellipulseSession) => void;
  updateSession: (id: string, updatedSession: IntellipulseSession) => void;
  deleteSession: (id: string) => void;
  clearAllSessions: () => Promise<void>;
  getSession: (id: string) => IntellipulseSession | undefined;
  syncSessions: () => Promise<void>;
  exportAllSessions: () => Promise<string>;
  importAllSessions: (jsonData: string) => Promise<void>;
  isLoading: boolean;
  isSupabaseLoaded: boolean;
}

export interface IntellipulseSession {
  id: string;
  title: string;
  messages: UIMessage[];
  createdAt: Date;
}

const IntellipulseSessionsContext = createContext<
  IntellipulseSessionsContextValue | undefined
>(undefined);

// DB and store name for IndexedDB
const DB_NAME = "deni-ai-intellipulse-db";
const DB_VERSION = 1;
const INTELLIPULSE_SESSIONS_STORE = "intellipulseSessions";
const CURRENT_INTELLIPULSE_SESSION_KEY = "currentIntellipulseSession";

// Helper functions for IndexedDB operations
const initDatabase = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(INTELLIPULSE_SESSIONS_STORE)) {
        const store = db.createObjectStore(INTELLIPULSE_SESSIONS_STORE, {
          keyPath: "id",
        });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
  });
};

const saveSessionToIndexedDB = async (
  session: IntellipulseSession
): Promise<void> => {
  const db = await initDatabase();
  const transaction = db.transaction(
    [INTELLIPULSE_SESSIONS_STORE],
    "readwrite"
  );
  const store = transaction.objectStore(INTELLIPULSE_SESSIONS_STORE);
  store.put({
    ...session,
    createdAt: session.createdAt.getTime(), // Store as timestamp
  });
};

const loadSessionsFromIndexedDB = async (): Promise<IntellipulseSession[]> => {
  try {
    const db = await initDatabase();
    const transaction = db.transaction(
      [INTELLIPULSE_SESSIONS_STORE],
      "readonly"
    );
    const store = transaction.objectStore(INTELLIPULSE_SESSIONS_STORE);
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

const deleteSessionFromIndexedDB = async (id: string): Promise<void> => {
  const db = await initDatabase();
  const transaction = db.transaction(
    [INTELLIPULSE_SESSIONS_STORE],
    "readwrite"
  );
  const store = transaction.objectStore(INTELLIPULSE_SESSIONS_STORE);
  store.delete(id);
};

const clearAllSessionsFromIndexedDB = async (): Promise<void> => {
  const db = await initDatabase();
  const transaction = db.transaction(
    [INTELLIPULSE_SESSIONS_STORE],
    "readwrite"
  );
  const store = transaction.objectStore(INTELLIPULSE_SESSIONS_STORE);
  store.clear();
};

export function IntellipulseSessionsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [sessions, setSessions] = useState<IntellipulseSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseLoaded, setIsSupabaseLoaded] = useState(false);
  const { user } = useAuth();
  const t = useTranslations("intellipulseSessions");

  // Generate a new session ID
  const generateSessionId = () => {
    return crypto.randomUUID();
  };
  // Create a new session
  const createSession = useCallback((): IntellipulseSession => {
    const newSession: IntellipulseSession = {
      id: generateSessionId(),
      title: "New Session",
      messages: [],
      createdAt: new Date(),
    };

    // Add the new session to the state
    setSessions((prev) => [newSession, ...prev]);
    
    // Save to appropriate storage based on authentication status
    if (user && isSupabaseLoaded && supabase) {
      // Save to Supabase for authenticated users
      supabase
        .from("intellipulse_sessions")
        .insert({
          id: newSession.id,
          user_id: user.id,
          title: newSession.title,
          messages: newSession.messages,
          created_at: newSession.createdAt.toISOString(),
        })
        .then(({ error }) => {
          if (error) {
            console.error("Error saving new session to Supabase:", error);
            // Fallback to IndexedDB on error
            saveSessionToIndexedDB(newSession).catch((indexedError) => {
              console.error("Error saving new session to IndexedDB fallback:", indexedError);
            });
          }
        });
    } else {
      // Save to IndexedDB for non-authenticated users
      saveSessionToIndexedDB(newSession).catch((error) => {
        console.error("Error saving new session to IndexedDB:", error);
      });
    }
    return newSession;
  }, [user, isSupabaseLoaded]);
  // Add a session
  const addSession = useCallback(
    async (session: IntellipulseSession) => {
      setSessions((prev) => {
        const newSessions = [session, ...prev];
        return newSessions;
      });

      // Save to appropriate storage based on authentication status
      if (user && isSupabaseLoaded && supabase) {
        // Save to Supabase for authenticated users
        try {
          const { error } = await supabase
            ?.from("intellipulse_sessions")
            .insert({
              id: session.id,
              user_id: user.id,
              title: session.title,
              messages: session.messages,
              created_at: session.createdAt.toISOString(),
            });

          if (error) {
            console.error("Error saving session to Supabase:", error);
            // Fallback to IndexedDB on error
            await saveSessionToIndexedDB(session);
          }
        } catch (error) {
          console.error("Error saving session to Supabase:", error);
          // Fallback to IndexedDB on error
          await saveSessionToIndexedDB(session);
        }
      } else {
        // Save to IndexedDB for non-authenticated users
        await saveSessionToIndexedDB(session);
      }
    },
    [user, isSupabaseLoaded]
  );
  // Update a session
  const updateSession = useCallback(
    async (id: string, updatedSession: IntellipulseSession) => {
      setSessions((prev) =>
        prev.map((session) => (session.id === id ? updatedSession : session))
      );

      // Save to appropriate storage based on authentication status
      if (user && isSupabaseLoaded && supabase) {
        // Update in Supabase for authenticated users
        try {
          const { error } = await supabase
            .from("intellipulse_sessions")
            .update({
              title: updatedSession.title,
              messages: updatedSession.messages,
              updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .eq("user_id", user.id);

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
    [user, isSupabaseLoaded]
  );
  // Delete a session
  const deleteSession = useCallback(
    async (id: string) => {
      setSessions((prev) => prev.filter((session) => session.id !== id));

      // Delete from appropriate storage based on authentication status
      if (user && isSupabaseLoaded && supabase) {
        // Delete from Supabase for authenticated users
        try {
          const { error } = await supabase
            .from("intellipulse_sessions")
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
    },
    [user, isSupabaseLoaded]
  );
  // Clear all sessions
  const clearAllSessions = useCallback(async () => {
    setSessions([]);

    // Clear from appropriate storage based on authentication status
    if (user && isSupabaseLoaded && supabase) {
      // Clear from Supabase for authenticated users
      try {
        const { error } = await supabase
          .from("intellipulse_sessions")
          .delete()
          .eq("user_id", user.id);

        if (error) {
          console.error("Error clearing sessions from Supabase:", error);
          // Fallback to IndexedDB clearing on error
          await clearAllSessionsFromIndexedDB();
        }
      } catch (error) {
        console.error("Error clearing sessions from Supabase:", error);
        // Fallback to IndexedDB clearing on error
        await clearAllSessionsFromIndexedDB();
      }
    } else {
      // Clear from IndexedDB for non-authenticated users
      await clearAllSessionsFromIndexedDB();
    }

    toast.success(t("sessionsCleared"));
  }, [user, isSupabaseLoaded, t]);

  // Get a specific session
  const getSession = useCallback(
    (id: string): IntellipulseSession | undefined => {
      return sessions.find((session) => session.id === id);
    },
    [sessions]
  );
  // Sync sessions from Supabase
  const syncSessions = useCallback(async () => {
    if (!user || !isSupabaseLoaded && !supabase) return;

    try {
      if (!supabase) return;
      const { data: supabaseSessions, error } = await supabase
        .from("intellipulse_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading sessions from Supabase:", error);
        return;
      }

      if (supabaseSessions) {
        const formattedSessions: IntellipulseSession[] = supabaseSessions.map(
          (session) => ({
            id: session.id,
            title: session.title || "",
            messages: session.messages || [],
            createdAt: new Date(session.created_at),
          })
        );

        setSessions(formattedSessions);
        
        // Do not sync to IndexedDB when user is authenticated and using Supabase
        // IndexedDB should only be used as fallback storage for non-authenticated users
      }
    } catch (error) {
      console.error("Error syncing sessions from Supabase:", error);
    }
  }, [user, isSupabaseLoaded]);

  // Export all sessions
  const exportAllSessions = useCallback(async (): Promise<string> => {
    const exportData = {
      sessions: sessions.map((session) => ({
        ...session,
        createdAt: session.createdAt.toISOString(),
      })),
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };
    return JSON.stringify(exportData, null, 2);
  }, [sessions]);

  // Import sessions
  const importAllSessions = useCallback(
    async (jsonData: string): Promise<void> => {
      try {
        const data = JSON.parse(jsonData);

        if (!data.sessions || !Array.isArray(data.sessions)) {
          throw new Error("Invalid import data format");
        }

        const importedSessions: IntellipulseSession[] = data.sessions.map(
          (session: any) => ({
            id: session.id || generateSessionId(),
            title: session.title || "",
            messages: session.messages || [],
            createdAt: new Date(session.createdAt),
          })
        );

        // Add imported sessions
        for (const session of importedSessions) {
          await addSession(session);
        }

        toast.success(
          t("sessionsImported", { count: importedSessions.length })
        );
      } catch (error) {
        console.error("Error importing sessions:", error);
        toast.error(t("importError"));
        throw error;
      }
    },
    [addSession, t]
  );
  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);

      // Only load from IndexedDB if user is not authenticated
      // For authenticated users, data will be loaded via syncSessions
      if (!user) {
        const indexedDBSessions = await loadSessionsFromIndexedDB();
        setSessions(indexedDBSessions);
      }

      setIsSupabaseLoaded(true);
      setIsLoading(false);
    };

    loadInitialData();
  }, [user]);

  // Sync with Supabase when user changes or Supabase is loaded
  useEffect(() => {
    if (user && isSupabaseLoaded) {
      syncSessions();
    } else if (!user) {
      // User logged out - only keep IndexedDB data
      const loadIndexedDBData = async () => {
        const indexedDBSessions = await loadSessionsFromIndexedDB();
        setSessions(indexedDBSessions);
      };
      loadIndexedDBData();
    }
  }, [user, isSupabaseLoaded, syncSessions]);

  const value: IntellipulseSessionsContextValue = {
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
    isLoading,
    isSupabaseLoaded,
  };

  return (
    <IntellipulseSessionsContext.Provider value={value}>
      {children}
    </IntellipulseSessionsContext.Provider>
  );
}

export function useIntellipulseSessions(): IntellipulseSessionsContextValue {
  const context = useContext(IntellipulseSessionsContext);
  if (!context) {
    throw new Error(
      "useIntellipulseSessions must be used within an IntellipulseSessionsProvider"
    );
  }
  return context;
}
