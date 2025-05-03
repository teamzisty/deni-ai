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
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { auth, firestore } from "@workspace/firebase-config/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface DevSessionsContextValue {
  sessions: DevSession[];
  createSession: () => DevSession;
  addSession: (session: DevSession) => void;
  updateSession: (id: string, updatedSession: DevSession) => void;
  deleteSession: (id: string) => void;
  clearAllSessions: () => Promise<void>;
  getSession: (id: string) => DevSession | undefined;
  syncSessions: () => Promise<void>;
  exportAllSessions: () => Promise<string>;
  importAllSessions: (jsonData: string) => Promise<void>;
  isLoading: boolean;
  isFirestoreLoaded: boolean;
}

export interface DevSession {
  id: string;
  title: string;
  messages: UIMessage[];
  createdAt: Date;
}

const DevSessionsContext = createContext<DevSessionsContextValue | undefined>(
  undefined
);

// DB and store name for IndexedDB
const DB_NAME = "deni-ai-dev-db";
const DB_VERSION = 1;
const DEV_SESSIONS_STORE = "devSessions";
const CURRENT_DEV_SESSION_KEY = "currentDevSession";

// Helper functions for IndexedDB operations
const initDatabase = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      reject(
        "Error opening IndexedDB: " + (event.target as IDBOpenDBRequest).error
      );
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      // Create object store for dev sessions if it doesn't exist
      if (!db.objectStoreNames.contains(DEV_SESSIONS_STORE)) {
        db.createObjectStore(DEV_SESSIONS_STORE, { keyPath: "id" });
      }
      // Create object store for current session
      if (!db.objectStoreNames.contains(CURRENT_DEV_SESSION_KEY)) {
        db.createObjectStore(CURRENT_DEV_SESSION_KEY, { keyPath: "id" });
      }
    };
  });
};

const saveSessionsToIndexedDB = async (
  sessions: DevSession[]
): Promise<void> => {
  try {
    const db = await initDatabase();
    const transaction = db.transaction(DEV_SESSIONS_STORE, "readwrite");
    const store = transaction.objectStore(DEV_SESSIONS_STORE);

    // Clear existing sessions
    store.clear();

    // Add sessions with serialized Date objects
    const serializedSessions = sessions.map((session) => ({
      ...session,
      createdAt: session.createdAt.toISOString(), // Convert Date to string for storage
    }));

    // Add each session
    for (const session of serializedSessions) {
      store.add(session);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = (e) => reject((e.target as IDBTransaction).error);
    });
  } catch (error) {
    console.error("Error saving sessions to IndexedDB:", error);
    throw error;
  }
};

const getSessionsFromIndexedDB = async (): Promise<DevSession[]> => {
  try {
    const db = await initDatabase();
    const transaction = db.transaction(DEV_SESSIONS_STORE, "readonly");
    const store = transaction.objectStore(DEV_SESSIONS_STORE);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        // Convert string dates back to Date objects
        const sessions = (event.target as IDBRequest).result.map(
          (session: any) => ({
            ...session,
            createdAt: new Date(session.createdAt),
          })
        );
        resolve(sessions);
      };
      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  } catch (error) {
    console.error("Error getting sessions from IndexedDB:", error);
    return [];
  }
};

const clearSessionsFromIndexedDB = async (): Promise<void> => {
  try {
    // Clear dev sessions
    const db = await initDatabase();
    const transaction = db.transaction(DEV_SESSIONS_STORE, "readwrite");
    const store = transaction.objectStore(DEV_SESSIONS_STORE);
    store.clear();
  } catch (error) {
    console.error("Error clearing sessions from IndexedDB:", error);
    throw error;
  }
};

export function DevSessionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<DevSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirestoreLoaded, setIsFirestoreLoaded] = useState(false);
  const [modifiedSessionIds, setModifiedSessionIds] = useState<Set<string>>(
    new Set()
  );
  const [prevAuthState, setPrevAuthState] = useState<boolean>(false);
  const t = useTranslations();

  // Save sessions to IndexedDB
  const saveToIndexedDB = useCallback(
    async (sessionsToSave: DevSession[]) => {
      if (user) return; // Only save to IndexedDB if user is not logged in

      try {
        await saveSessionsToIndexedDB(sessionsToSave);
      } catch (error) {
        console.error("Failed to save dev sessions to IndexedDB:", error);
        toast.error(
          t("devSessions.localStorageSaveFailed") || "Failed to save sessions"
        );
      }
    },
    [t, user]
  );

  // Load sessions from Firestore or IndexedDB
  useEffect(() => {
    const loadSessions = async () => {
      setIsFirestoreLoaded(false);
      setIsLoading(true);

      if (!user || !firestore) {
        // Load from IndexedDB when not authenticated
        try {
          const savedSessions = await getSessionsFromIndexedDB();
          if (savedSessions && savedSessions.length > 0) {
            setSessions(savedSessions);
          }
        } catch (error) {
          console.error("Failed to load dev sessions from IndexedDB:", error);
        } finally {
          setIsLoading(false);
          setIsFirestoreLoaded(true);
        }
        return;
      }

      // Load from Firestore when authenticated
      try {
        const sessionsRef = collection(
          firestore,
          `dev-conversations/${user.uid}/sessions`
        );
        const snapshot = await getDocs(sessionsRef);
        const loadedSessions = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as DevSession[];

        setSessions(loadedSessions);
      } catch (error) {
        console.error("Failed to load sessions from Firestore:", error);
        toast.error(t("devSessions.loadFailed") || "Failed to load sessions");

        // Fallback to IndexedDB
        try {
          const savedSessions = await getSessionsFromIndexedDB();
          if (savedSessions && savedSessions.length > 0) {
            setSessions(savedSessions);
          }
        } catch (localError) {
          console.error(
            "Failed to load sessions from IndexedDB fallback:",
            localError
          );
        }
      } finally {
        setIsLoading(false);
        setIsFirestoreLoaded(true);
      }
    };

    loadSessions();
  }, [user, t]);

  // Save sessions to Firestore or IndexedDB when they change
  useEffect(() => {
    // Create a debounced version of saveSessions
    const debounceTimeout = setTimeout(() => {
      const saveSessions = async () => {
        // Check if there are sessions and modifications
        if (sessions.length === 0 || modifiedSessionIds.size === 0) {
          return;
        }

        const currentModifiedIds = new Set(modifiedSessionIds);

        if (user && firestore) {
          // Save to Firestore
          try {
            // Filter sessions that need saving based on captured IDs
            const sessionsToSave = sessions.filter((session) =>
              currentModifiedIds.has(session.id)
            );

            if (sessionsToSave.length === 0) {
              return;
            }

            // Process each modified session individually
            for (const session of sessionsToSave) {
              const sessionsRef = collection(
                firestore,
                `dev-conversations/${user.uid}/sessions`
              );
              const docRef = doc(sessionsRef, session.id);
              const createdAt =
                session.createdAt instanceof Date
                  ? session.createdAt
                  : new Date(session.createdAt);

              const sessionData = {
                id: session.id || null,
                title: session.title || t("devSessions.newSession"),
                messages: Array.isArray(session.messages)
                  ? session.messages
                  : [],
                createdAt: Timestamp.fromDate(createdAt),
              };

              await setDoc(docRef, sessionData);

              // Remove this ID from the modified set once saved
              setModifiedSessionIds((prev) => {
                const next = new Set(prev);
                next.delete(session.id);
                return next;
              });
            }
          } catch (error) {
            console.error("Failed to save sessions to Firestore:", error);
            toast.error(
              t("devSessions.saveFailed") || "Failed to save sessions"
            );

            // Fallback to IndexedDB
            await saveToIndexedDB(sessions);
          }
        } else {
          // Save to IndexedDB when not authenticated
          await saveToIndexedDB(sessions);

          // Clear modified IDs since we saved to IndexedDB
          setModifiedSessionIds(new Set());
        }
      };

      saveSessions();
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(debounceTimeout);
  }, [sessions, user, modifiedSessionIds, t, firestore, saveToIndexedDB]);

  const createSession = useCallback(() => {
    const newSession: DevSession = {
      id: crypto.randomUUID(),
      title: t("devSessions.newSession") || "New Dev Session",
      messages: [],
      createdAt: new Date(),
    };

    const updatedSessions = [...sessions, newSession];
    setSessions(updatedSessions);
    setModifiedSessionIds((prev) => new Set(prev).add(newSession.id));

    // Save to IndexedDB if not using Firebase
    if (!user) {
      saveToIndexedDB(updatedSessions);
    }

    return newSession;
  }, [sessions, t, user, saveToIndexedDB]);

  const addSession = useCallback(
    (session: DevSession) => {
      const updatedSessions = [...sessions, session];
      setSessions(updatedSessions);
      setModifiedSessionIds((prev) => new Set(prev).add(session.id));

      // Save to IndexedDB if not using Firebase
      if (!user) {
        saveToIndexedDB(updatedSessions);
      }
    },
    [sessions, user, saveToIndexedDB]
  );

  const updateSession = useCallback(
    (id: string, updatedSession: DevSession) => {
      // Validate and ensure createdAt is a Date object before updating state
      const validatedSession = {
        ...updatedSession,
        createdAt:
          updatedSession.createdAt instanceof Date
            ? updatedSession.createdAt
            : new Date(updatedSession.createdAt),
      };

      const updatedSessions = sessions.map((session) =>
        session.id === id ? validatedSession : session
      );
      setSessions(updatedSessions);
      setModifiedSessionIds((prev) => new Set(prev).add(id));
      saveToIndexedDB(updatedSessions);
    },
    [sessions, user, saveToIndexedDB]
  );

  const deleteSession = useCallback(
    async (id: string) => {
      const updatedSessions = sessions.filter((session) => session.id !== id);
      setSessions(updatedSessions);

      // Delete from Firestore if logged in
      if (user && firestore) {
        try {
          const sessionDoc = doc(
            firestore,
            `dev-conversations/${user.uid}/sessions/${id}`
          );
          await deleteDoc(sessionDoc);
          toast.success(
            t("devSessions.sessionDeletedSuccess") || "Session deleted"
          );
        } catch (error) {
          console.error("Failed to delete session from Firestore:", error);
          toast.error(
            t("devSessions.sessionDeletedFailed") || "Failed to delete session"
          );
        }
      } else {
        // Save to IndexedDB if not using Firebase
        await saveToIndexedDB(updatedSessions);
        toast.success(
          t("devSessions.sessionDeletedSuccess") || "Session deleted"
        );
      }
    },
    [sessions, user, firestore, t, saveToIndexedDB]
  );

  const clearAllSessions = useCallback(async () => {
    // Store previous state for potential rollback if Firestore fails
    const previousSessions = [...sessions];

    // Optimistic UI update
    setSessions([]);
    setModifiedSessionIds(new Set());

    // Clear IndexedDB
    if (!user) {
      await clearSessionsFromIndexedDB();
      toast.success(
        t("devSessions.clearAllSuccess") || "All dev sessions cleared"
      );
      return Promise.resolve();
    }

    // Clear Firestore if logged in
    if (user && firestore) {
      try {
        const sessionsRef = collection(
          firestore,
          `dev-conversations/${user.uid}/sessions`
        );
        const sessionSnapshot = await getDocs(sessionsRef);

        const batch = writeBatch(firestore);
        sessionSnapshot.docs.forEach((doc) => batch.delete(doc.ref));

        await batch.commit();
        toast.success(
          t("devSessions.clearAllSuccess") || "All dev sessions cleared"
        );
      } catch (error) {
        console.error("Failed to clear sessions from Firestore:", error);
        // Revert local state
        setSessions(previousSessions);
        toast.error(
          t("devSessions.clearAllError") || "Failed to clear all sessions"
        );
        throw error;
      }
    }

    return Promise.resolve();
  }, [user, firestore, t, sessions]);

  const getSession = useCallback(
    (id: string) => sessions.find((session) => session.id === id),
    [sessions]
  );

  // Sync local changes to Firestore when user logs in
  const syncSessions = useCallback(async () => {
    if (!auth || !firestore) {
      toast.error(t("devSessions.firebaseNotReady") || "Firebase not ready");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast.error(t("devSessions.loginRequired") || "Login required for sync");
      return;
    }

    try {
      const uid = currentUser.uid;

      // Check IndexedDB for sessions to sync
      let indexedDBSessions: DevSession[] = [];
      try {
        indexedDBSessions = await getSessionsFromIndexedDB();
      } catch (error) {
        console.error("Error reading IndexedDB sessions:", error);
      }

      // Merge current sessions with IndexedDB
      const allSessions = [...sessions];
      if (indexedDBSessions.length > 0) {
        const existingIds = new Set(sessions.map((s) => s.id));
        const newLocalSessions = indexedDBSessions.filter(
          (s) => !existingIds.has(s.id)
        );
        if (newLocalSessions.length > 0) {
          allSessions.push(...newLocalSessions);
        }
      }

      // Save to Firestore
      const sessionsRef = collection(
        firestore,
        `dev-conversations/${uid}/sessions`
      );

      if (allSessions.length > 0) {
        const savePromises = allSessions.map((session) => {
          const sessionDoc = doc(sessionsRef, session.id);
          const createdAt =
            session.createdAt instanceof Date
              ? session.createdAt
              : new Date(session.createdAt);

          const sessionData = {
            id: session.id || null,
            title: session.title || t("devSessions.newSession"),
            messages: Array.isArray(session.messages) ? session.messages : [],
            createdAt: Timestamp.fromDate(createdAt),
          };

          Object.keys(sessionData).forEach((key) => {
            if ((sessionData as any)[key] === undefined) {
              console.warn(
                `Property ${key} is undefined in session ${session.id}, setting to null`
              );
              (sessionData as any)[key] = null;
            }
          });

          return setDoc(sessionDoc, sessionData);
        });

        await Promise.all(savePromises);
      }

      // Load from Firestore
      const snapshot = await getDocs(sessionsRef);
      const loadedSessions = snapshot.docs.map((doc) => {
        const data = doc.data();
        let createdAt: Date;
        if (data.createdAt && typeof data.createdAt.toDate === "function") {
          createdAt = data.createdAt.toDate();
        } else if (data.createdAt && typeof data.createdAt === "object") {
          createdAt = new Date(data.createdAt.seconds * 1000);
        } else {
          createdAt = new Date();
        }

        return {
          id: doc.id || null,
          title: data.title || t("devSessions.newSession"),
          messages: data.messages || [],
          createdAt: createdAt || new Date(),
        };
      }) as DevSession[];

      setSessions(loadedSessions);

      // Update IndexedDB with synced data
      await saveSessionsToIndexedDB(loadedSessions);

      toast.success(
        t("devSessions.syncSuccess") || "Sessions synced successfully"
      );
    } catch (error) {
      console.error("Failed to sync sessions:", error);
      let errorMessage =
        t("devSessions.syncFailed") || "Failed to sync sessions";
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      toast.error(errorMessage);
    }
  }, [user, sessions, t]);

  // Export all sessions
  const exportAllSessions = useCallback(async (): Promise<string> => {
    let sessionsToExport: DevSession[] = [];

    if (user && firestore) {
      try {
        const sessionsRef = collection(
          firestore,
          `dev-conversations/${user.uid}/sessions`
        );
        const snapshot = await getDocs(sessionsRef);
        sessionsToExport = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: (
            doc.data().createdAt?.toDate() || new Date()
          ).toISOString(),
        })) as unknown as DevSession[];
      } catch (error) {
        console.error(
          "Failed to fetch sessions from Firestore for export:",
          error
        );
        toast.error(
          t("devSessions.exportFirestoreFailed") ||
            "Failed to export from cloud"
        );

        // Fallback to IndexedDB
        try {
          sessionsToExport = await getSessionsFromIndexedDB();
        } catch (localError) {
          console.error(
            "Failed to read IndexedDB for export fallback:",
            localError
          );
          toast.error(
            t("devSessions.exportLocalFailed") || "Failed to export sessions"
          );
          sessionsToExport = [];
        }
      }
    } else {
      // Use IndexedDB
      try {
        sessionsToExport = await getSessionsFromIndexedDB();
      } catch (error) {
        console.error(
          "Failed to read sessions from IndexedDB for export:",
          error
        );
        toast.error(
          t("devSessions.exportLocalFailed") || "Failed to export sessions"
        );
        sessionsToExport = [];
      }
    }

    // Ensure createdAt is string for JSON
    const sessionsWithStringDate = sessionsToExport.map((s) => ({
      ...s,
      createdAt:
        s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
    }));

    return JSON.stringify(sessionsWithStringDate, null, 2);
  }, [user, t, firestore]);

  // Import sessions
  const importAllSessions = useCallback(
    async (jsonData: string): Promise<void> => {
      let importedSessions: DevSession[];
      try {
        const parsedData = JSON.parse(jsonData);
        if (!Array.isArray(parsedData)) {
          throw new Error("Invalid format: Data is not an array.");
        }

        importedSessions = parsedData.map((s: Record<string, unknown>) => ({
          ...s,
          createdAt: new Date(s.createdAt as string),
        })) as DevSession[];
      } catch (error) {
        console.error("Failed to parse imported JSON data:", error);
        toast.error(
          t("devSessions.importParseFailed") || "Failed to parse import data",
          {
            description: error instanceof Error ? error.message : String(error),
          }
        );
        return;
      }

      if (user && firestore) {
        // Import to Firestore
        try {
          const batch = writeBatch(firestore);
          const sessionsRef = collection(
            firestore,
            `dev-conversations/${user.uid}/sessions`
          );

          // Delete existing sessions first
          const existingSnapshot = await getDocs(sessionsRef);
          existingSnapshot.docs.forEach((doc) => batch.delete(doc.ref));

          // Add imported sessions
          importedSessions.forEach((session) => {
            const docRef = doc(sessionsRef, session.id);
            const sessionData = {
              ...session,
              createdAt: Timestamp.fromDate(
                session.createdAt instanceof Date
                  ? session.createdAt
                  : new Date(session.createdAt)
              ),
            };

            Object.keys(sessionData).forEach((key) => {
              if ((sessionData as Record<string, unknown>)[key] === undefined) {
                console.warn(
                  `Property ${key} is undefined in imported session ${session.id}, setting to null`
                );
                (sessionData as Record<string, unknown>)[key] = null;
              }
            });

            batch.set(docRef, sessionData);
          });

          await batch.commit();
          toast.success(
            t("devSessions.importFirestoreSuccess") ||
              "Sessions imported to cloud"
          );

          // Reload sessions
          await syncSessions();
        } catch (error) {
          console.error("Failed to import sessions to Firestore:", error);
          toast.error(
            t("devSessions.importFirestoreFailed") ||
              "Failed to import to cloud",
            {
              description:
                error instanceof Error ? error.message : String(error),
            }
          );
        }
      } else {
        // Import to IndexedDB
        try {
          await saveSessionsToIndexedDB(importedSessions);
          setSessions(importedSessions);

          toast.success(
            t("devSessions.importLocalSuccess") || "Sessions imported"
          );
        } catch (error) {
          console.error("Failed to import sessions to IndexedDB:", error);
          toast.error(
            t("devSessions.importLocalFailed") || "Failed to import sessions",
            {
              description:
                error instanceof Error ? error.message : String(error),
            }
          );
        }
      }
    },
    [user, t, syncSessions, firestore]
  );

  const value: DevSessionsContextValue = {
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
    isFirestoreLoaded,
  };

  return (
    <DevSessionsContext.Provider value={value}>
      {children}
    </DevSessionsContext.Provider>
  );
}

export function useDevSessions() {
  const context = useContext(DevSessionsContext);
  if (context === undefined) {
    throw new Error("useDevSessions must be used within a DevSessionsProvider");
  }
  return context;
}
