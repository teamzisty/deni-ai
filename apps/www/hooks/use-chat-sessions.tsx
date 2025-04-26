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

interface ChatSessionsContextValue {
  sessions: ChatSession[];
  createSession: () => ChatSession;
  addSession: (session: ChatSession) => void;
  updateSession: (id: string, updatedSession: ChatSession) => void;
  deleteSession: (id: string) => void;
  clearAllSessions: () => Promise<void>; // Make async
  selectSession: (id: string) => void;
  getSession: (id: string) => ChatSession | undefined;
  syncSessions: () => Promise<void>;
  exportAllSessions: () => Promise<string>; // Add export function
  importAllSessions: (jsonData: string) => Promise<void>; // Add import function
  isLoading: boolean;
  isFirestoreLoaded: boolean; // Add this
}

export interface ChatSession {
  id: string;
  title: string;
  messages: UIMessage[];
  createdAt: Date;
}

const ChatSessionsContext = createContext<ChatSessionsContextValue | undefined>(
  undefined
);

export function ChatSessionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isFirestoreLoaded, setIsFirestoreLoaded] = useState(false); // Add this
  const [modifiedSessionIds, setModifiedSessionIds] = useState<Set<string>>(new Set());
  const [prevAuthState, setPrevAuthState] = useState<boolean>(false);
  const t = useTranslations();


  // Helper function to sync sessions from localStorage to Firebase - wrapped in useCallback
  const syncLocalStorageToFirebase = useCallback(async (clearAfterSync = false) => {
    if (!user && !firestore) return; // Removed auth/firestore check as they are stable

    try {
      const savedSessions = localStorage.getItem("chatSessions");
      const savedCurrentSession = localStorage.getItem("currentChatSession");

      if (!savedSessions || savedSessions === "[]") {
        return;
      }

      const parsedSessions = JSON.parse(savedSessions);
      if (!Array.isArray(parsedSessions) || parsedSessions.length === 0) {
        return;
      }

      if (!firestore || !user) return; // Ensure firestore is available

      // Create references to Firestore
      const sessionsRef = collection(
        firestore,
        `deni-ai-conversations/${user.uid}/sessions`
      );

      // Save all sessions from localStorage to Firestore
      const savePromises = parsedSessions.map((session: ChatSession) => { // Added type
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

      // Save current session if available
      if (savedCurrentSession && savedCurrentSession !== "null") {
        const currentSessionData = JSON.parse(savedCurrentSession);
        if (!firestore) return; // Ensure firestore is available
        const activeSessionRef = doc(
          firestore,
          `deni-ai-conversations/${user.uid}/active/${currentSessionData.id}`
        );

        // Make sure createdAt is a Date
        const createdAt =
          currentSessionData.createdAt instanceof Date
            ? currentSessionData.createdAt
            : new Date(currentSessionData.createdAt);

        const sessionData: Record<string, unknown> = { // Changed any to unknown
          id: currentSessionData.id || null,
          title: currentSessionData.title || t("chatSessions.newChat"),
          messages: Array.isArray(currentSessionData.messages) ? currentSessionData.messages : [],
          createdAt: Timestamp.fromDate(createdAt)
        };

        // Ensure no undefined values
        Object.keys(sessionData).forEach(key => {
          if (sessionData[key] === undefined) {
            console.warn(`Property ${key} is undefined in current session, setting to null`);
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
                  invocation.result = ""; // Clear the result
                }
              });
            }
          });
          // Use the modified messages array for saving
          sessionData.messages = messagesToSave;
        }

        await setDoc(activeSessionRef, sessionData);
      }


      // Optionally clear localStorage after successful sync
      if (clearAfterSync) {
        localStorage.removeItem("chatSessions");
        localStorage.removeItem("currentChatSession");
      }

      // Toast success message
      toast.success(t("chatSessions.localSyncSuccess"));

      return true;
    } catch (error) {
      console.error("Failed to sync localStorage sessions to Firebase:", error);
      toast.error(t("chatSessions.localSyncFailed"));
      return false;
    }
  }, [user, t]); // Removed auth/firestore from dependencies

  // Track auth state changes to detect login
  useEffect(() => {
    const currentAuthState = !!user;

    // Only sync when user transitions from logged out to logged in
    if (currentAuthState && !prevAuthState) {
      syncLocalStorageToFirebase(false); // Keep local copies as backup
    }

    // Update previous auth state
    setPrevAuthState(currentAuthState);
  }, [user, prevAuthState, syncLocalStorageToFirebase]);

  // Load sessions from Firestore when user is authenticated
  useEffect(() => {
    const loadSessionsFromFirestore = async () => {
      setIsFirestoreLoaded(false); // Reset on user change/initial load
      // Firebase初期化状態のデバッグ出力
      if (!user) { // Removed auth/firestore check
        // Fallback to localStorage when Firebase is not available
        try {
          const savedSessions = localStorage.getItem("chatSessions");
          if (savedSessions && savedSessions !== "[]") {
            const parsedSessions = JSON.parse(savedSessions);
            if (Array.isArray(parsedSessions) && parsedSessions.length > 0) {
              setSessions(parsedSessions);
            }
          }

          const savedCurrentSession =
            localStorage.getItem("currentChatSession");
          if (savedCurrentSession && savedCurrentSession !== "null") {
            setCurrentSession(JSON.parse(savedCurrentSession));
          }
        } catch (error) {
          console.error("Failed to load sessions from localStorage:", error);
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
        const snapshot = await getDocs(sessionsRef);
        const loadedSessions = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as ChatSession[];

        setSessions(loadedSessions);

        let sessionToSetAsCurrent: ChatSession | null = null;

        // Try to find current active session from Firestore /active collection
        const activeCollectionRef = collection(
          firestore,
          `deni-ai-conversations/${user.uid}/active`
        );
        const activeSnapshot = await getDocs(activeCollectionRef);

        if (!activeSnapshot.empty) {
          // Use the most recently updated document in the active collection
          const activeSessionDocs = activeSnapshot.docs;
          let latestSession: ChatSession | null = null;
          let latestTimestamp: Date = new Date(0); // Start with epoch

          for (const docRef of activeSessionDocs) {
            const data = docRef.data();
            if (data.createdAt) {
              let timestamp: Date;

              if (typeof data.createdAt.toDate === "function") {
                timestamp = data.createdAt.toDate();
              } else if (data.createdAt && typeof data.createdAt === "object") {
                timestamp = new Date(data.createdAt.seconds * 1000);
              } else {
                timestamp = new Date();
              }

              if (timestamp > latestTimestamp) {
                latestTimestamp = timestamp;
                latestSession = {
                  id: data.id || docRef.id,
                  ...data,
                  createdAt: timestamp
                } as ChatSession;
              }
            }
          }

          if (latestSession) {
            // Verify if the session found in 'active' actually exists in the main 'sessions' list
            if (loadedSessions.some(s => s.id === latestSession!.id)) {
                 sessionToSetAsCurrent = latestSession;
            } else {
                 console.warn("Active session found in '/active' collection but not in '/sessions'. Clearing active entry.");
                 // Optionally delete the stale entry from /active
                 const staleActiveDocRef = doc(activeCollectionRef, latestSession.id);
                 await deleteDoc(staleActiveDocRef).catch(err => console.error("Failed to delete stale active session:", err));
            }
          }
        }

        // If no valid active session found in Firestore AND sessions were loaded,
        // set the most recent session from the main list as current.
        if (!sessionToSetAsCurrent && loadedSessions.length > 0) {
          console.log("No valid active session found, selecting the latest session from the list.");
          sessionToSetAsCurrent = loadedSessions.reduce((latest, session) =>
            // Ensure comparison is done correctly, assuming createdAt is always a Date object here
            (latest.createdAt instanceof Date && session.createdAt instanceof Date && latest.createdAt > session.createdAt) ? latest : session
          );
        }

        setCurrentSession(sessionToSetAsCurrent); // Set current session based on findings

      } catch (error) {
        console.error("Failed to load sessions from Firestore:", error);
        toast.error(t("chatSessions.loadFailed"));

        // On Firestore error, try to fall back to localStorage
        try {
          const savedSessions = localStorage.getItem("chatSessions");
          if (savedSessions && savedSessions !== "[]") {
            const parsedSessions = JSON.parse(savedSessions);
            if (Array.isArray(parsedSessions) && parsedSessions.length > 0) {
              setSessions(parsedSessions);
            }
          }

          const savedCurrentSession =
            localStorage.getItem("currentChatSession");
          if (savedCurrentSession && savedCurrentSession !== "null") {
            setCurrentSession(JSON.parse(savedCurrentSession));
          }
        } catch (localStorageError) {
          console.error(
            "Failed to load sessions from localStorage:",
            localStorageError
          );
        }
      } finally {
        setIsLoading(false);
        setIsFirestoreLoaded(true); // Set to true when loading finishes
      }
    };

    loadSessionsFromFirestore();
  }, [user, t]); // Revert dependency array to [user, t]

  // Save sessions to localStorage
  const saveToLocalStorage = useCallback((sessionsToSave: ChatSession[], currentSessionToSave: ChatSession | null) => {
    if (!user) { // Only save to localStorage if user is not logged in
      try {
        localStorage.setItem("chatSessions", JSON.stringify(sessionsToSave));
        if (currentSessionToSave) {
          localStorage.setItem("currentChatSession", JSON.stringify(currentSessionToSave));
        } else {
          localStorage.removeItem("currentChatSession");
        }
      } catch (error) {
        console.error("Failed to save sessions to localStorage:", error);
        toast.error(t("chatSessions.localStorageSaveFailed"));
      }
    }
  }, [user, t]);

  // Save sessions to storage (Firestore or localStorage)
  useEffect(() => {
    // Create a debounced version of saveSessions
    const debounceTimeout = setTimeout(() => {
      const saveSessions = async () => {
        // Check if there are sessions and modifications
        console.log("Attempting to save. Modified IDs:", modifiedSessionIds); // Log entry
        if (sessions.length === 0 || modifiedSessionIds.size === 0) {
            console.log("Save skipped: No sessions or no modifications.");
            return;
        }

        const currentModifiedIds = new Set(modifiedSessionIds); // Capture current modified IDs

        if (user && auth && firestore) {
          // Save to Firestore only
          try {
            const sessionsRef = collection(
              firestore,
              `deni-ai-conversations/${user.uid}/sessions`
            );

            // Filter sessions that need saving based on captured IDs
            const sessionsToSave = sessions.filter(session => currentModifiedIds.has(session.id));

            if (sessionsToSave.length === 0) {
                console.log("Save skipped: No matching sessions found for modified IDs.");
                return;
            }
            console.log(`Saving ${sessionsToSave.length} sessions to Firestore:`, sessionsToSave.map(s => ({ id: s.id, title: s.title, msgCount: s.messages.length }))); // Log data being saved

            const savePromises = sessionsToSave.map((session) => {
              const docRef = doc(sessionsRef, session.id);
              const createdAt =
                session.createdAt instanceof Date
                  ? session.createdAt
                  : new Date(session.createdAt);

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

              Object.keys(sessionData).forEach(key => {
                if (sessionData[key] === undefined) {
                  console.warn(`Property ${key} is undefined in session ${session.id}, setting to null`);
                  sessionData[key] = null;
                }
              });
              return setDoc(docRef, sessionData);
            });

            await Promise.all(savePromises);
            console.log("Successfully saved sessions to Firestore.");

            // Clear ONLY the saved IDs from the main set
            setModifiedSessionIds(prev => {
                const next = new Set(prev);
                currentModifiedIds.forEach(id => next.delete(id));
                return next;
            });
          } catch (error) {
            console.error("Failed to save sessions to Firestore:", error);
            toast.error(t("chatSessions.saveFailed"));
            // Fallback logic...
          }
        } else {
          // Save to localStorage
          try {
             const sessionsToSave = sessions.filter(session => currentModifiedIds.has(session.id));
             if (sessionsToSave.length > 0) {
                 const existingSessions = JSON.parse(localStorage.getItem("chatSessions") || "[]");
                 const existingSessionsMap = new Map(existingSessions.map((s: ChatSession) => [s.id, s]));
                 sessionsToSave.forEach(session => existingSessionsMap.set(session.id, session));
                 const mergedSessions = Array.from(existingSessionsMap.values());
                 localStorage.setItem("chatSessions", JSON.stringify(mergedSessions));
                 console.log(`Saved ${sessionsToSave.length} sessions to localStorage.`);
                // Clear ONLY the saved IDs from the main set
                setModifiedSessionIds(prev => {
                    const next = new Set(prev);
                    currentModifiedIds.forEach(id => next.delete(id));
                    return next;
                });
             }
          } catch (error) {
            console.error("Failed to save sessions to localStorage:", error);
          }
        }
      };

      saveSessions();
    }, 1000); // Debounce for 1 second

    // Cleanup function to clear the timeout if dependencies change before timeout fires
    return () => clearTimeout(debounceTimeout);

    // Keep dependencies, ensure firestore/auth are stable or handled correctly if they change
  }, [sessions, user, modifiedSessionIds, t, firestore, auth]);

  // Save current session to storage (Firestore or localStorage)
  useEffect(() => {
    const saveCurrentSession = async () => {
      if (!currentSession) return; // Skip if no current session

      console.log("Attempting to save current session:", { id: currentSession.id, title: currentSession.title, msgCount: currentSession.messages.length });

      // Debounce this save operation
      const debounceTimeout = setTimeout(async () => {
        console.log("Executing debounced saveCurrentSession for:", currentSession.id);
        if (user && auth && firestore) {
          try {
            const currentSessionRef = doc(
              firestore,
              `deni-ai-conversations/${user.uid}/active/${currentSession.id}`
            );
            const createdAt =
              currentSession.createdAt instanceof Date
                ? currentSession.createdAt
                : new Date(currentSession.createdAt);

            const sessionData: Record<string, unknown> = { 
              id: currentSession.id || null,
              title: currentSession.title || t("chatSessions.newChat"),
              messages: Array.isArray(currentSession.messages) ? currentSession.messages : [],
              createdAt: Timestamp.fromDate(createdAt)
            };

            // Clear large tool invocation results before saving to prevent exceeding size limits
            if (Array.isArray(sessionData.messages)) {
              // Create a deep copy to avoid modifying the original state directly
              // Using structuredClone for a more robust deep copy than JSON.parse(JSON.stringify(...))
              const messagesToSave = structuredClone(sessionData.messages);

              messagesToSave.forEach((message: any) => { // Using 'any' for simplicity, consider defining a stricter type
                if (message.toolInvocations && Array.isArray(message.toolInvocations)) {
                  message.toolInvocations.forEach((invocation: any) => { // Using 'any' for simplicity
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
                console.warn(`Property ${key} is undefined in current session, setting to null`);
                sessionData[key] = null;
              }
            });

            console.log("Saving current session to Firestore:", sessionData);

            await setDoc(currentSessionRef, sessionData);
            console.log("Successfully saved current session to Firestore active collection.");
          } catch (error) {
            console.error("Failed to save current session to Firestore:", error);
            toast.error(t("chatSessions.saveCurrentFailed"));
            // localStorage fallback logic could go here
            try {
               localStorage.setItem("currentChatSession", JSON.stringify(currentSession));
               console.log("Saved current session fallback to localStorage.");
            } catch (localError) { /* Handle error */ }
          }
        } else {
          // Firestore not available, save to localStorage
          try {
            localStorage.setItem("currentChatSession", JSON.stringify(currentSession));
            console.log("Saved current session to localStorage.");
          } catch (error) {
            console.error("Failed to save current session to localStorage:", error);
          }
        }
      }, 1200); // Debounce for 1.2 seconds (slightly longer than saveSessions)

      // Cleanup function to clear the timeout if dependencies change before timeout fires
      return () => clearTimeout(debounceTimeout);
    };

    saveCurrentSession();
  }, [currentSession, user, t, firestore, auth]); // Keep dependencies

  const createSession = useCallback(() => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: t("chatSessions.newChat"),
      messages: [],
      createdAt: new Date(),
    };

    const updatedSessions = [...sessions, newSession];
    setSessions(updatedSessions);
    setCurrentSession(newSession);
    setModifiedSessionIds((prev) => new Set(prev).add(newSession.id));

    saveToLocalStorage(updatedSessions, newSession); // Save to localStorage

    return newSession;
  }, [sessions, t, saveToLocalStorage]); // Add saveToLocalStorage dependency

  const addSession = useCallback((session: ChatSession) => {
    const updatedSessions = [...sessions, session];
    setSessions(updatedSessions);
    setModifiedSessionIds((prev) => new Set(prev).add(session.id));
    saveToLocalStorage(updatedSessions, currentSession); // Save to localStorage
  }, [sessions, currentSession, saveToLocalStorage]); // Add currentSession and saveToLocalStorage dependencies

  const updateSession = useCallback((id: string, updatedSession: ChatSession) => {
    // Validate and ensure createdAt is a Date object before updating state
    const validatedSession = {
      ...updatedSession,
      createdAt: updatedSession.createdAt instanceof Date ? updatedSession.createdAt : new Date(updatedSession.createdAt),
    };

    const updatedSessions = sessions.map((session) =>
      session.id === id ? validatedSession : session
    );
    setSessions(updatedSessions);
    setModifiedSessionIds((prev) => new Set(prev).add(id));

    // Update current session if it's the one being updated
    let newCurrentSession = currentSession;
    if (currentSession?.id === id) {
      newCurrentSession = validatedSession;
      setCurrentSession(newCurrentSession);
    }

    saveToLocalStorage(updatedSessions, newCurrentSession); // Save to localStorage

  }, [sessions, currentSession, saveToLocalStorage]); // Add currentSession and saveToLocalStorage dependencies

  const deleteSession = useCallback(async (id: string) => { // Make async for potential Firestore op
    const updatedSessions = sessions.filter((session) => session.id !== id);
    setSessions(updatedSessions);

    let newCurrentSession = currentSession;
    if (currentSession?.id === id) {
      // Find the latest session to set as current
      newCurrentSession =
        updatedSessions.length > 0
          ? updatedSessions.reduce((latest, session) =>
              latest.createdAt > session.createdAt ? latest : session
            )
          : null;
      setCurrentSession(newCurrentSession);
    }

    saveToLocalStorage(updatedSessions, newCurrentSession); // Save to localStorage

    if (user && firestore) { // Only delete from Firestore if logged in
      try {
        const sessionDoc = doc(
          firestore,
          `deni-ai-conversations/${user.uid}/sessions/${id}`
        );
        await deleteDoc(sessionDoc);
        toast.success(t("chatSessions.sessionDeletedSuccess"));

        // Also remove from active collection if it was the active one
        const activeSessionDoc = doc(
          firestore,
          `deni-ai-conversations/${user.uid}/active/${id}`
        );
        await deleteDoc(activeSessionDoc).catch(() => {}); // Ignore error if not active
      } catch (error) {
        console.error("Failed to delete session from Firestore:", error);
        toast.error(t("chatSessions.sessionDeletedFailed"));
        // Optionally revert local state if Firestore delete fails
        // setSessions(sessions); // Revert
        // setCurrentSession(currentSession); // Revert
      }
    } else {
        toast.success(t("chatSessions.sessionDeletedSuccess")); // Show success even if only local
    }
  }, [sessions, currentSession, user, firestore, t, saveToLocalStorage]); // Add dependencies

  const clearAllSessions = useCallback(async () => {
    // Define the async logic to be wrapped by toast.promise
    const clearPromise = async () => {
      // Store previous state for potential rollback *only* if Firestore fails
      const previousSessions = [...sessions];
      const previousCurrentSession = currentSession;

      // Optimistic UI update: Clear local state immediately
      setSessions([]);
      setCurrentSession(null);
      setModifiedSessionIds(new Set());
      saveToLocalStorage([], null); // Clear localStorage

      if (user && firestore) { // Only clear Firestore if logged in
        try {
          const sessionsRef = collection(
            firestore,
            `deni-ai-conversations/${user.uid}/sessions`
          );
          const activeRef = collection(
            firestore,
            `deni-ai-conversations/${user.uid}/active`
          );
          const sessionSnapshot = await getDocs(sessionsRef);
          const activeSnapshot = await getDocs(activeRef);

          const batch = writeBatch(firestore);
          sessionSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
          activeSnapshot.docs.forEach((doc) => batch.delete(doc.ref));

          await batch.commit();
          // Firestore operation successful
        } catch (error) {
          console.error("Failed to clear sessions from Firestore:", error);
          // Revert local state because Firestore clear failed
          setSessions(previousSessions);
          setCurrentSession(previousCurrentSession);
          saveToLocalStorage(previousSessions, previousCurrentSession); // Restore localStorage
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
      currentSession,
      saveToLocalStorage,
      setSessions, // Add setter dependencies
      setCurrentSession, // Add setter dependencies
      setModifiedSessionIds // Add setter dependencies
  ]);


  const selectSession = useCallback((id: string) => {
    const selected = sessions.find((session) => session.id === id);
    if (selected) {
      setCurrentSession(selected);
      saveToLocalStorage(sessions, selected); // Save updated current session
    }
  }, [sessions, saveToLocalStorage]); // Add saveToLocalStorage dependency

  const getSession = useCallback((id: string) =>
    sessions.find((session) => session.id === id)
  , [sessions]);


  // Sync sessions between tabs using localStorage events - wrapped in useCallback
  const handleStorageChange = useCallback((event: StorageEvent) => {
    if (user) return; // Don't sync via localStorage if logged in

    if (event.key === "chatSessions") {
      try {
        const newSessions = event.newValue ? JSON.parse(event.newValue) : [];
         // Ensure createdAt is a Date object
        const loadedSessions = newSessions.map((s: any) => ({
          ...s,
          createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
        }));
        setSessions(loadedSessions);
      } catch (error) {
        console.error("Error parsing sessions from storage event:", error);
      }
    } else if (event.key === "currentChatSession") {
      try {
        const newCurrentSession = event.newValue ? JSON.parse(event.newValue) : null;
         // Ensure createdAt is a Date object
        const currentSessionData = newCurrentSession ? {
            ...newCurrentSession,
             createdAt: newCurrentSession.createdAt ? new Date(newCurrentSession.createdAt) : new Date(),
        } : null;
        setCurrentSession(currentSessionData);
      } catch (error) {
        console.error("Error parsing current session from storage event:", error);
      }
    }
  }, [user]); // Add user dependency

  // Add/remove storage event listener
  useEffect(() => {
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [user, handleStorageChange]); // Add user dependency


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

      // Also check localStorage for any sessions that might need to be synced
      let localStorageSessions: ChatSession[] = [];
      try {
        const savedSessions = localStorage.getItem("chatSessions");
        if (savedSessions && savedSessions !== "[]") {
          const parsedSessions = JSON.parse(savedSessions);
          if (Array.isArray(parsedSessions) && parsedSessions.length > 0) {
            localStorageSessions = parsedSessions;
          }
        }
      } catch (localStorageError) {
        console.error("Error reading localStorage sessions:", localStorageError);
      }

      // Merge current sessions with localStorage sessions
      const allSessions = [...sessions];

      // Add localStorage sessions if they don't already exist
      if (localStorageSessions.length > 0) {
        const existingIds = new Set(sessions.map(s => s.id));
        const newLocalSessions = localStorageSessions.filter(s => !existingIds.has(s.id));

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

      // 現在のアクティブセッションを保存
      if (currentSession) {
        const activeSessionRef = doc(
          firestore, // firestore is checked above
          `deni-ai-conversations/${uid}/active/${currentSession.id}`
        );

        // createdAtがDate型であることを確認
        const createdAt =
          currentSession.createdAt instanceof Date
            ? currentSession.createdAt
            : new Date(currentSession.createdAt);

        // undefinedを含まないオブジェクトを作成
        const sessionData: Record<string, unknown> = {
          id: currentSession.id || null,
          title: currentSession.title || t("chatSessions.newChat"),
          messages: Array.isArray(currentSession.messages) ? currentSession.messages : [],
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
            console.warn(`Property ${key} is undefined in active session, setting to null`);
            sessionData[key] = null;
          }
        });

        await setDoc(activeSessionRef, sessionData);
      }

      // Firestoreからセッションを読み込む
      const snapshot = await getDocs(sessionsRef);

      const loadedSessions = snapshot.docs.map((doc) => {
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

      // Find the active session from the active collection
      const activeCollectionRef = collection(
        firestore, // firestore is checked above
        `deni-ai-conversations/${uid}/active`
      );
      const activeSnapshot = await getDocs(activeCollectionRef);

      if (!activeSnapshot.empty) {
        // Use the most recently updated document in the active collection
        const activeSessionDocs = activeSnapshot.docs;
        let latestSession: ChatSession | null = null; // Changed any to ChatSession | null
        let latestTimestamp: Date = new Date(0); // Start with epoch

        for (const docRef of activeSessionDocs) { // Renamed doc to docRef
          const data = docRef.data();
          if (data.createdAt) {
            let timestamp: Date;

            if (typeof data.createdAt.toDate === "function") {
              timestamp = data.createdAt.toDate();
            } else if (data.createdAt && typeof data.createdAt === "object") {
              timestamp = new Date(data.createdAt.seconds * 1000);
            } else {
              timestamp = new Date();
            }

            if (timestamp > latestTimestamp) {
              latestTimestamp = timestamp;
              latestSession = {
                id: data.id || docRef.id,
                ...data,
                createdAt: timestamp
              } as ChatSession; // Added type assertion
            }
          }
        }

        if (latestSession) {
          setCurrentSession(latestSession);
        }
      }

      // Clear localStorage after successful sync if needed
      if (localStorageSessions.length > 0) {
        try {
          // Optional: You might want to clear localStorage after syncing
          // localStorage.removeItem("chatSessions");
          // localStorage.removeItem("currentChatSession");
          // Or just keep them as a backup

          // Alternatively, update localStorage with the latest data from Firebase
          localStorage.setItem("chatSessions", JSON.stringify(loadedSessions));
          if (currentSession) {
            localStorage.setItem("currentChatSession", JSON.stringify(currentSession));
          }
        } catch (error) {
          console.error("Error updating localStorage after sync:", error);
        }
      }

      toast.success(t("chatSessions.syncSuccess"));
    } catch (error) {
      console.error("Failed to sync sessions:", error);
      let errorMessage = t("chatSessions.syncFailed");
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      toast.error(errorMessage);
    }
  }, [user, sessions, currentSession, t, setSessions, setCurrentSession]); // Added dependencies

  // --- New Export Function ---
  const exportAllSessions = useCallback(async (): Promise<string> => {
    let sessionsToExport: ChatSession[] = [];

    if (user && firestore && auth) { // Removed auth/firestore check
      try {
        const sessionsRef = collection(
          firestore,
          `deni-ai-conversations/${user.uid}/sessions`
        );
        const snapshot = await getDocs(sessionsRef);
        sessionsToExport = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          // Convert Timestamp to ISO string for JSON compatibility
          createdAt: (doc.data().createdAt?.toDate() || new Date()).toISOString(),
        })) as unknown as ChatSession[]; // Adjust type assertion as needed
      } catch (error) {
        console.error("Failed to fetch sessions from Firestore for export:", error);
        toast.error(t("chatSessions.exportFirestoreFailed"));
        // Fallback to localStorage on Firestore error
        try {
          const savedSessions = localStorage.getItem("chatSessions");
          sessionsToExport = savedSessions ? JSON.parse(savedSessions) : [];
        } catch (localError) {
          console.error("Failed to read localStorage for export fallback:", localError);
          toast.error(t("chatSessions.exportLocalFailed"));
          sessionsToExport = []; // Ensure it's an empty array on double failure
        }
      }
    } else {
      // Firestore not available, use localStorage
      try {
        const savedSessions = localStorage.getItem("chatSessions");
        sessionsToExport = savedSessions ? JSON.parse(savedSessions) : [];
      } catch (error) {
        console.error("Failed to read sessions from localStorage for export:", error);
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
  }, [user, t]); // Removed auth/firestore from dependencies

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

    if (user && firestore && auth) { // Removed auth/firestore check
      // Import to Firestore (overwrite strategy)
      try {
        const batch = writeBatch(firestore);
        const sessionsRef = collection(
          firestore,
          `deni-ai-conversations/${user.uid}/sessions`
        );

        // Optional: Delete existing sessions before importing (clean slate)
        // const existingSnapshot = await getDocs(sessionsRef);
        // existingSnapshot.docs.forEach(doc => batch.delete(doc.ref));
        // console.log("Cleared existing Firestore sessions before import");

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

      } catch (error) {
        console.error("Failed to import sessions to Firestore:", error);
        toast.error(t("chatSessions.importFirestoreFailed"), {
          description: error instanceof Error ? error.message : String(error),
        });
        // Optionally fallback to localStorage on Firestore error? Or just fail?
        // Let's just fail for now to avoid inconsistent states.
      }
    } else {
      // Import to localStorage (overwrite)
      try {
        // Ensure createdAt is string for localStorage compatibility if needed,
        // but internal state uses Date, so keep as Date for setSessions.
        localStorage.setItem("chatSessions", JSON.stringify(importedSessions.map(s => ({
            ...s,
            createdAt: s.createdAt.toISOString() // Store as ISO string
        }))));
        setSessions(importedSessions); // Update local state directly
        setCurrentSession(null); // Reset current session after import
        localStorage.removeItem("currentChatSession"); // Clear potentially outdated current session
        toast.success(t("chatSessions.importLocalSuccess"));
      } catch (error) {
        console.error("Failed to import sessions to localStorage:", error);
        toast.error(t("chatSessions.importLocalFailed"), {
          description: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }, [user, t, syncSessions, setSessions, setCurrentSession]); // Removed auth/firestore from dependencies

  const value: ChatSessionsContextValue = {
    sessions,
    createSession,
    addSession,
    updateSession,
    deleteSession,
    clearAllSessions,
    selectSession,
    getSession,
    syncSessions,
    exportAllSessions, // Add to context value
    importAllSessions, // Add to context value
    isLoading,
    isFirestoreLoaded, // Add to context
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
