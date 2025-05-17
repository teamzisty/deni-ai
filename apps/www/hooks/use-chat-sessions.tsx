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
import { Bot } from "@/types/bot";

interface ChatSessionsContextValue {
  sessions: ChatSession[];
  createSession: (bot?: Bot) => ChatSession;
  addSession: (session: ChatSession) => void;
  updateSession: (id: string, updatedSession: ChatSession) => void;
  deleteSession: (id: string) => void;
  clearAllSessions: () => Promise<void>; // Make async
  getSession: (id: string) => ChatSession | undefined;
  syncSessions: () => Promise<void>;
  exportAllSessions: () => Promise<string>; // Add export function
  importAllSessions: (jsonData: string) => Promise<void>; // Add import function
  createBranchSession: (
    parentSession: ChatSession,
    branchName: string
  ) => ChatSession;
  createBranchFromMessage: ( // Add this function
    parentSession: ChatSession,
    messageId: string,
    branchName: string
  ) => ChatSession | undefined;
  isLoading: boolean;
  isFirestoreLoaded: boolean; // Add this
}

export interface ChatSession {
  id: string;
  title: string;
  messages: UIMessage[];
  createdAt: Date;
  isBranch?: boolean; // Optional: Indicates if the session is a branch
  bot?: Bot; // Optional: The bot if associated
  parentSessionId?: string; // Optional: ID of the parent session if it's a branch
  branchName?: string; // Optional: Name of the branch
  hubId?: string; // Optional: ID of the hub if associated
}

const ChatSessionsContext = createContext<ChatSessionsContextValue | undefined>(
  undefined
);

// Add constants for IndexedDB configuration
const DB_NAME = "deni-ai-chat-db";
const DB_VERSION = 1;
const CHAT_SESSIONS_STORE = "chatSessions";
const FIRESTORE_TIMEOUT_MS = 15000; // 15 seconds timeout for Firestore operations

// Helper function for Firestore getDocs with timeout
const getDocsWithTimeout = async (query: any, timeoutMs: number) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Firestore operation timed out')), timeoutMs)
  );
  return Promise.race([getDocs(query), timeoutPromise]);
};

// Helper functions for IndexedDB operations
const initDatabase = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      reject("Error opening IndexedDB: " + (event.target as IDBOpenDBRequest).error);
    };
    
    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      // Create object store for chat sessions if it doesn't exist
      if (!db.objectStoreNames.contains(CHAT_SESSIONS_STORE)) {
        db.createObjectStore(CHAT_SESSIONS_STORE, { keyPath: "id" });
      }
    };
  });
};

const saveSessionsToIndexedDB = async (sessions: ChatSession[]): Promise<void> => {
  try {
    const db = await initDatabase();
    const transaction = db.transaction(CHAT_SESSIONS_STORE, "readwrite");
    const store = transaction.objectStore(CHAT_SESSIONS_STORE);
    
    // Clear existing sessions
    store.clear();
    
    // Add sessions with serialized Date objects
    const serializedSessions = sessions.map(session => ({
      ...session,
      createdAt: session.createdAt.toISOString() // Convert Date to string
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

const getSessionsFromIndexedDB = async (): Promise<ChatSession[]> => {
  try {
    const db = await initDatabase();
    const transaction = db.transaction(CHAT_SESSIONS_STORE, "readonly");
    const store = transaction.objectStore(CHAT_SESSIONS_STORE);
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        // Convert string dates back to Date objects
        const sessions = (event.target as IDBRequest).result.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt)
        }));
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
    const db = await initDatabase();
    const transaction = db.transaction(CHAT_SESSIONS_STORE, "readwrite");
    const store = transaction.objectStore(CHAT_SESSIONS_STORE);
    store.clear();
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = (e) => reject((e.target as IDBTransaction).error);
    });
  } catch (error) {
    console.error("Error clearing sessions from IndexedDB:", error);
    throw error;
  }
};

export function ChatSessionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirestoreLoaded, setIsFirestoreLoaded] = useState(false); // Add this
  const [modifiedSessionIds, setModifiedSessionIds] = useState<Set<string>>(new Set());
  const [prevAuthState, setPrevAuthState] = useState<boolean>(false);
  const t = useTranslations();


  // Helper function to sync sessions from IndexedDB to Firebase - wrapped in useCallback
  const syncIndexedDBToFirebase = useCallback(async (clearAfterSync = false) => {
    if (!user && !firestore) return; // Removed auth/firestore check

    try {
      // Get sessions from IndexedDB
      const savedSessions = await getSessionsFromIndexedDB();

      if (!savedSessions || savedSessions.length === 0) {
        return;
      }

      if (!firestore || !user) return; // Ensure firestore is available

      // Create references to Firestore
      const sessionsRef = collection(
        firestore,
        `deni-ai-conversations/${user.uid}/sessions`
      );

      // Save all sessions from IndexedDB to Firestore
      const savePromises = savedSessions.map((session: ChatSession) => { // Added type
        const sessionDoc = doc(sessionsRef, session.id);
        // Make sure createdAt is a Date
        const createdAt =
          session.createdAt instanceof Date
            ? session.createdAt
            : new Date(session.createdAt);

        const sessionData: Record<string, unknown> = { // Changed any to unknown
          id: session.id || null,
          title: session.title || t("chatSessions.newChat"),
          messages: Array.isArray(session.messages) ? session.messages : [],
          createdAt: Timestamp.fromDate(createdAt)
        };

        // Ensure no undefined values
        Object.keys(sessionData).forEach(key => {
          if (sessionData[key] === undefined) {
            console.warn(`Property ${key} is undefined in session ${session.id}, setting to null`);
            sessionData[key] = null;
          }
        });

        // Clear large tool invocation results before saving to prevent exceeding size limits
        if (Array.isArray(sessionData.messages)) {
          // Create a deep copy to avoid modifying the original state directly
          const messagesToSave = JSON.parse(JSON.stringify(sessionData.messages));

          messagesToSave.forEach((message: any) => {
            if (message.toolInvocations && Array.isArray(message.toolInvocations)) {
              message.toolInvocations.forEach((invocation: any) => {
                if (invocation && typeof invocation.result !== 'undefined') {
                  if (invocation.toolName === "search") {
                    invocation.result = ""; // Clear the result
                  }
                }
              });
            }
          });
          // Use the modified messages array for saving
          sessionData.messages = messagesToSave;
        }

        return setDoc(sessionDoc, sessionData);
      });

      await Promise.all(savePromises);


      // Optionally clear IndexedDB after successful sync
      if (clearAfterSync) {
        await clearSessionsFromIndexedDB();
      }

      // Toast success message
      toast.success(t("chatSessions.localSyncSuccess"));

      return true;
    } catch (error) {
      console.error("Failed to sync IndexedDB sessions to Firebase:", error);
      toast.error(t("chatSessions.localSyncFailed"));
      return false;
    }
  }, [user, t]); // Removed auth/firestore from dependencies

  // Track auth state changes to detect login
  useEffect(() => {
    const currentAuthState = !!user;

    // Only sync when user transitions from logged out to logged in
    if (currentAuthState && !prevAuthState) {
      syncIndexedDBToFirebase(false); // Keep local copies as backup
    }

    // Update previous auth state
    setPrevAuthState(currentAuthState);
  }, [user, prevAuthState, syncIndexedDBToFirebase]);

  // Load sessions from Firestore when user is authenticated
  useEffect(() => {
    const loadSessionsFromFirestore = async () => {
      setIsFirestoreLoaded(false); // Reset on user change/initial load
      // Firebase初期化状態のデバッグ出力
      if (!user) { // Removed auth/firestore check
        // Fallback to IndexedDB when Firebase is not available
        try {
          const savedSessions = await getSessionsFromIndexedDB();
          if (savedSessions && savedSessions.length > 0) {
            setSessions(savedSessions);
          }
        } catch (error) {
          console.error("Failed to load sessions from IndexedDB:", error);
        }
        setIsLoading(false);
        setIsFirestoreLoaded(true); // Set to true when loading finishes
        return;
      }

      try {
        setIsLoading(true);
        if (!user || !firestore || !auth) return;
        const sessionsRef = collection(
          firestore,
          `deni-ai-conversations/${user.uid}/sessions`
        );
        // const snapshot = await getDocs(sessionsRef); // Original call
        const snapshot = await getDocsWithTimeout(sessionsRef, FIRESTORE_TIMEOUT_MS) as any; // Using timeout

        const loadedSessions = snapshot.docs.map((doc: any) => ({ // Added type for doc
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as ChatSession[];

        setSessions(loadedSessions);
      } catch (error: any) {
        console.error("Failed to load sessions from Firestore:", error);
        const errorMessage = error.message && error.message.includes('timed out')
          ? t("chatSessions.loadFailedTimeout")
          : t("chatSessions.loadFailed");
        toast.error(errorMessage);

        // On Firestore error (including timeout), try to fall back to IndexedDB
        try {
          const savedSessions = await getSessionsFromIndexedDB();
          if (savedSessions && savedSessions.length > 0) {
            setSessions(savedSessions);
          }
        } catch (localError) {
          console.error(
            "Failed to load sessions from IndexedDB during fallback:",
            localError
          );
        }
      } finally {
        setIsLoading(false);
        setIsFirestoreLoaded(true); // Set to true when loading finishes
      }
    };

    loadSessionsFromFirestore();
  }, [user, t]); // Revert dependency array to [user, t]

  // Save sessions to IndexedDB
  const saveToIndexedDB = useCallback(async (sessionsToSave: ChatSession[]) => {
    if (!user) { // Only save to IndexedDB if user is not logged in
      try {
        await saveSessionsToIndexedDB(sessionsToSave);
      } catch (error) {
        console.error("Failed to save sessions to IndexedDB:", error);
        toast.error(t("chatSessions.localStorageSaveFailed"));
      }
    }
  }, [user, t]);

  // Save sessions to storage (Firestore or IndexedDB)
  useEffect(() => {
    // Create a debounced version of saveSessions
    const debounceTimeout = setTimeout(() => {
      const saveSessions = async () => {
        // Check if there are sessions and modifications
        if (sessions.length === 0 || modifiedSessionIds.size === 0) {
            return;
        }

        const currentModifiedIds = new Set(modifiedSessionIds); // Capture current modified IDs

        if (user && auth && firestore) {
          // Save to Firestore only
          try {
            // Filter sessions that need saving based on captured IDs
            const sessionsToSave = sessions.filter(session => currentModifiedIds.has(session.id));

            if (sessionsToSave.length === 0) {
                return;
            }

            // Process each modified session individually instead of in batch
            for (const session of sessionsToSave) {
              const sessionsRef = collection(
                firestore,
                `deni-ai-conversations/${user.uid}/sessions`
              );
              const docRef = doc(sessionsRef, session.id);
              const createdAt =
                session.createdAt instanceof Date
                  ? session.createdAt
                  : new Date(session.createdAt);

              const sessionData: Record<string, unknown> = {
                id: session.id || null,
                title: session.title || t("chatSessions.newChat"),
                messages: Array.isArray(session.messages) ? session.messages : [],
                createdAt: Timestamp.fromDate(createdAt),
                isBranch: session.isBranch || false,
                hubId: session.hubId || null,
                bot: session.bot || null,
                parentSessionId: session.parentSessionId || null,
                branchName: session.branchName || null,
              };

              // Clear large tool invocation results before saving to prevent exceeding size limits
              if (Array.isArray(sessionData.messages)) {
                // Create a deep copy to avoid modifying the original state directly
                const messagesToSave = JSON.parse(JSON.stringify(sessionData.messages));

                messagesToSave.forEach((message: any) => {
                  if (message.toolInvocations && Array.isArray(message.toolInvocations)) {
                    message.toolInvocations.forEach((invocation: any) => {
                      if (invocation && typeof invocation.result !== 'undefined') {
                        invocation.result = ""; // Clear the result
                      }
                    });
                  }
                });
                // Use the modified messages array for saving
                sessionData.messages = messagesToSave;
              }

              Object.keys(sessionData).forEach(key => {
                if (sessionData[key] === undefined) {
                  console.warn(`Property ${key} is undefined in session ${session.id}, setting to null`);
                  sessionData[key] = null;
                }
              });
              
              await setDoc(docRef, sessionData);
              
              // Remove this ID from the modified set once saved
              setModifiedSessionIds(prev => {
                const next = new Set(prev);
                next.delete(session.id);
                return next;
              });
            }

          } catch (error) {
            console.error("Failed to save sessions to Firestore:", error);
            toast.error(t("chatSessions.saveFailed"));
            // Fallback logic...
            // Save to IndexedDB if firestore fails
            try {
              const sessionsToSave = sessions.filter(session => currentModifiedIds.has(session.id));
              if (sessionsToSave.length > 0) {
                await saveSessionsToIndexedDB(sessionsToSave);
                // Clear ONLY the saved IDs from the main set even on fallback
                sessionsToSave.forEach(session => {
                  setModifiedSessionIds(prev => {
                    const next = new Set(prev);
                    next.delete(session.id);
                    return next;
                  });
                });
              }
            } catch (localError) {
                console.error("Failed to save sessions to IndexedDB during Firestore fallback:", localError);
            }
          }
        } else {
          // Save to IndexedDB (user not logged in)
          try {
            const sessionsToSave = sessions.filter(session => currentModifiedIds.has(session.id));
            if (sessionsToSave.length > 0) {
              // Get existing sessions from IndexedDB
              const existingSessions = await getSessionsFromIndexedDB();
              const existingSessionsMap = new Map(existingSessions.map((s: ChatSession) => [s.id, s]));
              
              // Update with modified sessions
              sessionsToSave.forEach(session => existingSessionsMap.set(session.id, session));
              const mergedSessions = Array.from(existingSessionsMap.values());
              
              // Save all sessions back to IndexedDB
              await saveSessionsToIndexedDB(mergedSessions);
              
              // Clear ONLY the saved IDs from the main set
              sessionsToSave.forEach(session => {
                setModifiedSessionIds(prev => {
                  const next = new Set(prev);
                  next.delete(session.id);
                  return next;
                });
              });
            }
          } catch (error) {
            console.error("Failed to save sessions to IndexedDB:", error);
          }
        }
      };

      saveSessions();
    }, 1000); // Debounce for 1 second

    // Cleanup function to clear the timeout if dependencies change before timeout fires
    return () => clearTimeout(debounceTimeout);

    // Keep dependencies, ensure firestore/auth are stable or handled correctly if they change
  }, [sessions, user, modifiedSessionIds, t, firestore, auth]);

  const createSession = useCallback((bot?: Bot) => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: t("chatSessions.newChat"),
      messages: [],
      createdAt: new Date(),
    };

    if (bot) {
      newSession.bot = bot;
    }

    const updatedSessions = [...sessions, newSession];
    setSessions(updatedSessions);
    setModifiedSessionIds((prev) => new Set(prev).add(newSession.id));

    saveToIndexedDB(updatedSessions);

    return newSession;
  }, [sessions, t, saveToIndexedDB]);

  const createBranchSession = useCallback((parentSession: ChatSession, branchName: string) => {
    const newBranchSession: ChatSession = {
      ...parentSession, // Copy all properties from parent
      id: crypto.randomUUID(), // Generate a new unique ID for the branch
      title: `${parentSession.title} (${branchName})`, // Or a more sophisticated naming
      isBranch: true,
      parentSessionId: parentSession.id,
      branchName: branchName,
      createdAt: new Date(), // Set new creation date for the branch
      messages: parentSession.messages.map(msg => ({ ...msg })), // Deep copy messages
    };

    const updatedSessions = [...sessions, newBranchSession];
    setSessions(updatedSessions);
    setModifiedSessionIds((prev) => new Set(prev).add(newBranchSession.id));
    saveToIndexedDB(updatedSessions);

    toast.success(t("chatSessions.branchCreatedSuccess", { branchName })); // Add translation
    return newBranchSession;
  }, [sessions, t, saveToIndexedDB]);

  const createBranchFromMessage = useCallback(
    (parentSession: ChatSession, messageId: string, branchName: string) => {
      const messageIndex = parentSession.messages.findIndex(
        (msg) => msg.id === messageId
      );

      if (messageIndex === -1) {
        toast.error(t("chatSessions.messageNotFoundForBranch"));
        return undefined;
      }

      // Create a new session with messages up to the selected message
      const messagesForBranch = parentSession.messages
        .slice(0, messageIndex + 1)
        .map((msg) => ({ ...msg })); // Deep copy messages

      const newBranchSession: ChatSession = {
        id: crypto.randomUUID(),
        title: `${parentSession.title} (${branchName} - branched from message)`,
        messages: messagesForBranch,
        createdAt: new Date(),
        isBranch: true,
        parentSessionId: parentSession.id,
        branchName: branchName,
      };

      const updatedSessions = [...sessions, newBranchSession];
      setSessions(updatedSessions);
      setModifiedSessionIds((prev) => new Set(prev).add(newBranchSession.id));
      saveToIndexedDB(updatedSessions);

      toast.success(
        t("chatSessions.branchFromMessageCreatedSuccess", { branchName })
      );
      return newBranchSession;
    },
    [sessions, t, saveToIndexedDB]
  );

  const addSession = useCallback((session: ChatSession) => {
    const updatedSessions = [...sessions, session];
    setSessions(updatedSessions);
    setModifiedSessionIds((prev) => new Set(prev).add(session.id));
    saveToIndexedDB(updatedSessions);
  }, [sessions, saveToIndexedDB]);

  const updateSession = useCallback((id: string, updatedSession: ChatSession) => {
    // Validate and ensure createdAt is a Date object before updating state
    const validatedSession = {
      ...updatedSession,
      createdAt: updatedSession.createdAt instanceof Date ? updatedSession.createdAt : new Date(updatedSession.createdAt),
    };

    setSessions(prev => {
      // Only update the specific session that needs to be updated
      return prev.map(session => session.id === id ? validatedSession : session);
    });
    
    // Mark only this session as modified
    setModifiedSessionIds(prev => new Set(prev).add(id));

    // If not using Firestore, also update IndexedDB immediately for this session
    if (!user) {
      (async () => {
        try {
          const existingSessions = await getSessionsFromIndexedDB();
          const existingSessionsMap = new Map(existingSessions.map((s: ChatSession) => [s.id, s]));
          existingSessionsMap.set(id, validatedSession);
          const mergedSessions = Array.from(existingSessionsMap.values());
          await saveSessionsToIndexedDB(mergedSessions);
        } catch (error) {
          console.error("Failed to immediately update session in IndexedDB:", error);
        }
      })();
    }
  }, [user, setSessions]);

  const deleteSession = useCallback(async (id: string) => {
    const updatedSessions = sessions.filter((session) => session.id !== id);
    setSessions(updatedSessions);

    saveToIndexedDB(updatedSessions);

    if (user && firestore) { // Only delete from Firestore if logged in
      try {
        const sessionDoc = doc(
          firestore,
          `deni-ai-conversations/${user.uid}/sessions/${id}`
        );
        await deleteDoc(sessionDoc);
        toast.success(t("chatSessions.sessionDeletedSuccess"));
      } catch (error) {
        console.error("Failed to delete session from Firestore:", error);
        toast.error(t("chatSessions.sessionDeletedFailed"));
      }
    } else {
        toast.success(t("chatSessions.sessionDeletedSuccess")); // Show success even if only local
    }
  }, [sessions, user, firestore, t, saveToIndexedDB]);

  const clearAllSessions = useCallback(async () => {
    // Define the async logic to be wrapped by toast.promise
    const clearPromise = async () => {
      // Store previous state for potential rollback *only* if Firestore fails
      const previousSessions = [...sessions];

      // Optimistic UI update: Clear local state immediately
      setSessions([]);
      setModifiedSessionIds(new Set());
      await clearSessionsFromIndexedDB();

      if (user && firestore) { // Only clear Firestore if logged in
        try {
          const sessionsRef = collection(
            firestore,
            `deni-ai-conversations/${user.uid}/sessions`
          );
          const sessionSnapshot = await getDocs(sessionsRef);

          const batch = writeBatch(firestore);
          sessionSnapshot.docs.forEach((doc) => batch.delete(doc.ref));

          await batch.commit();
          // Firestore operation successful
        } catch (error) {
          console.error("Failed to clear sessions from Firestore:", error);
          // Revert local state because Firestore clear failed
          setSessions(previousSessions);
          await saveSessionsToIndexedDB(previousSessions);
          // Throw the error to reject the promise and trigger the error toast
          throw error;
        }
      }
      // If not logged in or Firestore operation was successful, the promise resolves
    };

    // Wrap the async logic with toast.promise
    toast.promise(clearPromise(), {
      loading: t("settings.popupMessages.deleteAllLoading"),
      success: t("settings.popupMessages.deleteAllSuccess"),
      error: t("settings.popupMessages.deleteAllError"),
    });

  }, [
      user,
      firestore,
      t,
      sessions,
      setSessions,
      setModifiedSessionIds
  ]);

  const getSession = useCallback((id: string) =>
    sessions.find((session) => session.id === id)
  , [sessions]);


  // Sync local changes to Firestore when user logs in - wrapped in useCallback
  const syncSessions = useCallback(async () => {
    // Ensure auth and firestore are initialized
    if (!auth || !firestore) {
      console.error("Firebase auth or firestore is not initialized.");
      toast.error(t("chatSessions.firebaseNotReady"));
      return;
    }

    // 現在のユーザーを再取得して認証状態を再確認
    const currentUser = auth.currentUser;

    // Check if user is authenticated
    if (!currentUser) {
      console.error(
        "User is not authenticated. Current user from auth:",
        currentUser,
        "User from context:",
        user
      );
      toast.error(t("chatSessions.loginRequired"));

      // 認証が必要であることを伝え、再ログインを促す
      toast.error(t("chatSessions.reauthRequired"));
      return;
    }

    try {
      // ユーザーIDにcurrentUserのuidを使用して確実に現在の認証状態を反映
      const uid = currentUser.uid;

      // Also check IndexedDB for any sessions that might need to be synced
      let indexedDBSessions: ChatSession[] = [];
      try {
        indexedDBSessions = await getSessionsFromIndexedDB();
      } catch (localError) {
        console.error("Error reading IndexedDB sessions:", localError);
      }

      // Merge current sessions with IndexedDB sessions
      const allSessions = [...sessions];

      // Add IndexedDB sessions if they don't already exist
      if (indexedDBSessions.length > 0) {
        const existingIds = new Set(sessions.map(s => s.id));
        const newLocalSessions = indexedDBSessions.filter(s => !existingIds.has(s.id));

        if (newLocalSessions.length > 0) {
          allSessions.push(...newLocalSessions);
        }
      }

      // セッションコレクションの参照を作成
      const sessionsRef = collection(
        firestore, // firestore is checked above
        `deni-ai-conversations/${uid}/sessions`
      );

      // まず、既存のセッションをFirestoreに保存（更新または作成）
      if (allSessions.length > 0) {
        const savePromises = allSessions.map((session) => {
          const sessionDoc = doc(sessionsRef, session.id);
          // createdAtがDate型であることを確認
          const createdAt =
            session.createdAt instanceof Date
              ? session.createdAt
              : new Date(session.createdAt);

          // undefinedを含まないオブジェクトを作成
          const sessionData: Record<string, unknown> = {
            id: session.id || null,
            title: session.title || t("chatSessions.newChat"),
            messages: Array.isArray(session.messages) ? session.messages : [],
            createdAt: Timestamp.fromDate(createdAt)
          };

          // Clear large tool invocation results before saving to prevent exceeding size limits
          if (Array.isArray(sessionData.messages)) {
            // Create a deep copy to avoid modifying the original state directly
            const messagesToSave = JSON.parse(JSON.stringify(sessionData.messages));

            messagesToSave.forEach((message: any) => {
              if (message.toolInvocations && Array.isArray(message.toolInvocations)) {
                message.toolInvocations.forEach((invocation: any) => {
                  if (invocation && typeof invocation.result !== 'undefined') {
                    invocation.result = ""; // Clear the result
                  }
                });
              }
            });
            // Use the modified messages array for saving
            sessionData.messages = messagesToSave;
          }

          // すべてのプロパティがundefinedでないことを確認
          Object.keys(sessionData).forEach(key => {
            if (sessionData[key] === undefined) {
              console.warn(`Property ${key} is undefined in session ${session.id}, setting to null`);
              sessionData[key] = null;
            }
          });

          return setDoc(sessionDoc, sessionData);
        });

        await Promise.all(savePromises);
      }

      // Firestoreからセッションを読み込む
      // const snapshot = await getDocs(sessionsRef); // Original call
      const snapshot = await getDocsWithTimeout(sessionsRef, FIRESTORE_TIMEOUT_MS) as any; // Using timeout


      const loadedSessions = snapshot.docs.map((doc: any) => { // Added type for doc
        const data = doc.data();
        // createdAtフィールドの変換を安全に行う
        let createdAt: Date;
        if (data.createdAt && typeof data.createdAt.toDate === "function") {
          createdAt = data.createdAt.toDate();
        } else if (data.createdAt && typeof data.createdAt === "object") {
          createdAt = new Date(data.createdAt.seconds * 1000);
        } else {
          createdAt = new Date();
        }

        // undefined値を除外し、デフォルト値を設定
        return {
          id: doc.id || null,
          title: data.title || t("chatSessions.newChat"),
          messages: data.messages || [],
          createdAt: createdAt || new Date(),
        };
      }) as ChatSession[];

      setSessions(loadedSessions);

      // Clear IndexedDB after successful sync if needed
      if (indexedDBSessions.length > 0) {
        try {
          // Optionally, update IndexedDB with the latest data from Firebase
          await saveSessionsToIndexedDB(loadedSessions);
        } catch (error) {
          console.error("Error updating IndexedDB after sync:", error);
        }
      }

      toast.success(t("chatSessions.syncSuccess"));
    } catch (error: any) { // Added type for error
      console.error("Failed to sync sessions:", error);
      let errorMessage = error.message && error.message.includes('timed out')
        ? t("chatSessions.syncFailedTimeout")
        : t("chatSessions.syncFailed");
      if (error instanceof Error && !(error.message && error.message.includes('timed out'))) {
        errorMessage += `: ${error.message}`;
      }
      toast.error(errorMessage);
    }
  }, [user, sessions, t, setSessions]);

  // --- New Export Function ---
  const exportAllSessions = useCallback(async (): Promise<string> => {
    let sessionsToExport: ChatSession[] = [];

    if (user && firestore && auth) {
      try {
        const sessionsRef = collection(
          firestore,
          `deni-ai-conversations/${user.uid}/sessions`
        );
        // const snapshot = await getDocs(sessionsRef); // Original call
        const snapshot = await getDocsWithTimeout(sessionsRef, FIRESTORE_TIMEOUT_MS) as any; // Using timeout
        sessionsToExport = snapshot.docs.map((doc: any) => ({ // Added type for doc
          id: doc.id,
          ...doc.data(),
          // Convert Timestamp to ISO string for JSON compatibility
          createdAt: (doc.data().createdAt?.toDate() || new Date()).toISOString(),
        })) as unknown as ChatSession[]; // Adjust type assertion as needed
      } catch (error: any) {
        console.error("Failed to fetch sessions from Firestore for export:", error);
        const errorMessage = error.message && error.message.includes('timed out')
          ? t("chatSessions.exportFirestoreFailedTimeout")
          : t("chatSessions.exportFirestoreFailed");
        toast.error(errorMessage);
        // Fallback to IndexedDB on Firestore error
        try {
          const savedSessions = await getSessionsFromIndexedDB();
          sessionsToExport = savedSessions;
        } catch (localError) {
          console.error("Failed to read IndexedDB for export fallback:", localError);
          toast.error(t("chatSessions.exportLocalFailed"));
          sessionsToExport = []; // Ensure it's an empty array on double failure
        }
      }
    } else {
      // Firestore not available, use IndexedDB
      try {
        const savedSessions = await getSessionsFromIndexedDB();
        sessionsToExport = savedSessions;
      } catch (error) {
        console.error("Failed to read sessions from IndexedDB for export:", error);
        toast.error(t("chatSessions.exportLocalFailed"));
        sessionsToExport = []; // Ensure it's an empty array on error
      }
    }

    // Ensure createdAt is string for JSON
    const sessionsWithStringDate = sessionsToExport.map(s => ({
      ...s,
      createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt
    }));

    return JSON.stringify(sessionsWithStringDate, null, 2); // Pretty print JSON
  }, [user, t, firestore, auth]);

  // --- New Import Function ---
  const importAllSessions = useCallback(async (jsonData: string): Promise<void> => {
    let importedSessions: ChatSession[];
    try {
      const parsedData = JSON.parse(jsonData);
      if (!Array.isArray(parsedData)) {
        throw new Error("Invalid format: Data is not an array.");
      }
      // Basic validation for each session object could be added here
      importedSessions = parsedData.map((s: Record<string, unknown>) => ({ // Changed any to Record<string, unknown>
        ...s,
        // Ensure createdAt is parsed back into a Date object for internal use
        createdAt: new Date(s.createdAt as string), // Added type assertion
      })) as ChatSession[]; // Added type assertion
    } catch (error) {
      console.error("Failed to parse imported JSON data:", error);
      toast.error(t("chatSessions.importParseFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      return; // Stop import process
    }

    if (user && firestore && auth) {
      // Import to Firestore (overwrite strategy)
      try {
        const batch = writeBatch(firestore);
        const sessionsRef = collection(
          firestore,
          `deni-ai-conversations/${user.uid}/sessions`
        );

        // Optional: Delete existing sessions before importing (clean slate)
        // const existingSnapshot = await getDocs(sessionsRef); // Original call
        const existingSnapshot = await getDocsWithTimeout(sessionsRef, FIRESTORE_TIMEOUT_MS) as any; // Using timeout
        existingSnapshot.docs.forEach((doc: any) => batch.delete(doc.ref)); // Added type for doc

        // Add imported sessions
        importedSessions.forEach((session) => {
          const docRef = doc(sessionsRef, session.id);
          const sessionData = {
            ...session,
            // Convert Date back to Timestamp for Firestore
            createdAt: Timestamp.fromDate(session.createdAt instanceof Date ? session.createdAt : new Date(session.createdAt)),
          };
           // Ensure no undefined values
           Object.keys(sessionData).forEach(key => {
             if ((sessionData as Record<string, unknown>)[key] === undefined) { // Changed any to Record<string, unknown>
               console.warn(`Property ${key} is undefined in imported session ${session.id}, setting to null`);
               (sessionData as Record<string, unknown>)[key] = null; // Changed any to Record<string, unknown>
             }
           });
          batch.set(docRef, sessionData);
        });

        await batch.commit();
        toast.success(t("chatSessions.importFirestoreSuccess"));

        // Reload sessions from Firestore to update UI state
        await syncSessions(); // Use syncSessions to reload and update state

      } catch (error: any) { // Added type for error
        console.error("Failed to import sessions to Firestore:", error);
        const errorMessage = error.message && error.message.includes('timed out')
          ? t("chatSessions.importFirestoreFailedTimeout")
          : t("chatSessions.importFirestoreFailed");
        toast.error(errorMessage, {
          description: error instanceof Error ? error.message : String(error),
        });
      }
    } else {
      // Import to IndexedDB (overwrite)
      try {
        await saveSessionsToIndexedDB(importedSessions);
        setSessions(importedSessions); // Update local state directly
        toast.success(t("chatSessions.importLocalSuccess"));
      } catch (error) {
        console.error("Failed to import sessions to IndexedDB:", error);
        toast.error(t("chatSessions.importLocalFailed"), {
          description: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }, [user, t, syncSessions, setSessions, firestore, auth]);


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
    isLoading,
    isFirestoreLoaded,
    createBranchSession,
    createBranchFromMessage, // Add this
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
