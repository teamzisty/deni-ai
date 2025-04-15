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
  const [modifiedSessionIds, setModifiedSessionIds] = useState<Set<string>>(new Set());
  const [prevAuthState, setPrevAuthState] = useState<boolean>(false);
  const t = useTranslations("chatSessions");


  // Helper function to sync sessions from localStorage to Firebase - wrapped in useCallback
  const syncLocalStorageToFirebase = useCallback(async (clearAfterSync = false) => {
    if (!user && !firestore) return; // Removed auth/firestore check as they are stable

    console.log("Syncing localStorage sessions to Firebase");

    try {
      const savedSessions = localStorage.getItem("chatSessions");
      const savedCurrentSession = localStorage.getItem("currentChatSession");

      if (!savedSessions || savedSessions === "[]") {
        console.log("No localStorage sessions to sync");
        return;
      }

      const parsedSessions = JSON.parse(savedSessions);
      if (!Array.isArray(parsedSessions) || parsedSessions.length === 0) {
        console.log("No valid localStorage sessions to sync");
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
          title: session.title || t("newChat"),
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

        console.log(`Syncing localStorage session ${session.id} to Firebase`);
        return setDoc(sessionDoc, sessionData);
      });

      await Promise.all(savePromises);
      console.log(`Successfully synced ${parsedSessions.length} sessions from localStorage to Firebase`);

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
          title: currentSessionData.title || t("newChat"),
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

        console.log("Syncing localStorage current session to Firebase");
        await setDoc(activeSessionRef, sessionData);
        console.log("Successfully synced current session from localStorage to Firebase");
      }

      // Optionally clear localStorage after successful sync
      if (clearAfterSync) {
        console.log("Clearing localStorage after successful sync");
        localStorage.removeItem("chatSessions");
        localStorage.removeItem("currentChatSession");
      }

      // Toast success message
      toast.success(t("localSyncSuccess"));

      return true;
    } catch (error) {
      console.error("Failed to sync localStorage sessions to Firebase:", error);
      toast.error(t("localSyncFailed"));
      return false;
    }
  }, [user, t]); // Removed auth/firestore from dependencies

  // Track auth state changes to detect login
  useEffect(() => {
    const currentAuthState = !!user;

    // Only sync when user transitions from logged out to logged in
    if (currentAuthState && !prevAuthState) {
      console.log("Auth state changed: user logged in, syncing localStorage to Firebase");
      syncLocalStorageToFirebase(false); // Keep local copies as backup
    }

    // Update previous auth state
    setPrevAuthState(currentAuthState);
  }, [user, prevAuthState, syncLocalStorageToFirebase]);

  // Load sessions from Firestore when user is authenticated
  useEffect(() => {
    const loadSessionsFromFirestore = async () => {
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

        // Try to find current active session
        // First try to find sessions in the active collection
        const activeCollectionRef = collection(
          firestore,
          `deni-ai-conversations/${user.uid}/active`
        );
        const activeSnapshot = await getDocs(activeCollectionRef);

        if (!activeSnapshot.empty) {
          // Use the most recently updated document in the active collection
          const activeSessionDocs = activeSnapshot.docs;
          let latestSession: ChatSession | null = null; // Changed any to ChatSession | null
          let latestTimestamp: Date = new Date(0); // Start with epoch

          for (const docRef of activeSessionDocs) { // Renamed doc to docRef for clarity
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
            console.log("Found active session:", latestSession.id);
          } else {
            console.log("No valid active session found");
          }
        } else {
          console.log("No active sessions found in Firestore");
        }
      } catch (error) {
        console.error("Failed to load sessions from Firestore:", error);
        toast.error(t("loadFailed"));

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
      }
    };

    loadSessionsFromFirestore();
  }, [user, t]); // Removed auth/firestore from dependencies

  // Save sessions to storage (Firestore or localStorage)
  useEffect(() => {
    const saveSessions = async () => {
      if (sessions.length === 0 || modifiedSessionIds.size === 0) return;

      if (user && auth && firestore) { // Removed auth/firestore check
        // Save to Firestore only
        try {
          const sessionsRef = collection(
            firestore,
            `deni-ai-conversations/${user.uid}/sessions`
          );

          // 修正されたセッションのみを保存
          const savePromises = sessions
            .filter(session => modifiedSessionIds.has(session.id))
            .map((session) => {
              const docRef = doc(sessionsRef, session.id);
              // createdAtがDate型であることを確認
              const createdAt =
                session.createdAt instanceof Date
                  ? session.createdAt
                  : new Date(session.createdAt);

              // undefined値を除外し、nullに置き換える
              const sessionData: Record<string, unknown> = { // Changed any to unknown
                id: session.id || null,
                title: session.title || t("newChat"),
                messages: Array.isArray(session.messages) ? session.messages : [],
                createdAt: Timestamp.fromDate(createdAt)
              };

              // すべてのプロパティがundefinedでないことを確認
              Object.keys(sessionData).forEach(key => {
                if (sessionData[key] === undefined) {
                  console.warn(`Property ${key} is undefined in session ${session.id}, setting to null`);
                  sessionData[key] = null;
                }
              });

              console.log("Saving session:", sessionData);

              return setDoc(docRef, sessionData);
            });

          // すべての処理を実行
          await Promise.all(savePromises);

          // 保存が完了したらmodifiedSessionIdsをクリア
          setModifiedSessionIds(new Set());
        } catch (error) {
          console.error("Failed to save sessions to Firestore:", error);
          toast.error(t("saveFailed"));

          // Firestoreに保存失敗した場合のみlocalStorageにフォールバック
          try {
            const sessionsToSave = sessions.filter(session => modifiedSessionIds.has(session.id));
            // 既存のセッションと更新対象のセッションをマージ
            const existingSessions = JSON.parse(localStorage.getItem("chatSessions") || "[]");
            const existingSessionsMap = new Map(existingSessions.map((s: ChatSession) => [s.id, s]));

            // 更新対象のセッションだけ置き換える
            sessionsToSave.forEach(session => {
              existingSessionsMap.set(session.id, session);
            });

            // Mapを配列に戻してlocalStorageに保存
            const mergedSessions = Array.from(existingSessionsMap.values());
            localStorage.setItem("chatSessions", JSON.stringify(mergedSessions));
          } catch (localStorageError) {
            console.error(
              "Failed to save sessions to localStorage:",
              localStorageError
            );
          }
        }
      } else {
        // Firestore利用不可の場合のみlocalStorageに保存
        try {
          const sessionsToSave = sessions.filter(session => modifiedSessionIds.has(session.id));
          // 既存のセッションと更新対象のセッションをマージ
          const existingSessions = JSON.parse(localStorage.getItem("chatSessions") || "[]");
          const existingSessionsMap = new Map(existingSessions.map((s: ChatSession) => [s.id, s]));

          // 更新対象のセッションだけ置き換える
          sessionsToSave.forEach(session => {
            existingSessionsMap.set(session.id, session);
          });

          // Mapを配列に戻してlocalStorageに保存
          const mergedSessions = Array.from(existingSessionsMap.values());
          localStorage.setItem("chatSessions", JSON.stringify(mergedSessions));

          // 保存が完了したらmodifiedSessionIdsをクリア
          setModifiedSessionIds(new Set());
        } catch (error) {
          console.error(
            "Failed to save sessions to localStorage:",
            error
          );
        }
      }
    };

    saveSessions();
  }, [sessions, user, modifiedSessionIds, t]); // Removed auth/firestore from dependencies

  // Save current session to storage (Firestore or localStorage)
  useEffect(() => {
    const saveCurrentSession = async () => {
      if (!currentSession) return;

      if (user && auth && firestore) { // Removed auth/firestore check
        // Save to Firestore only
        try {
          const currentSessionRef = doc(
            firestore,
            `deni-ai-conversations/${user.uid}/active/${currentSession.id}`
          );
          // createdAtがDate型であることを確認
          const createdAt =
            currentSession.createdAt instanceof Date
              ? currentSession.createdAt
              : new Date(currentSession.createdAt);

          // undefined値を除外し、nullに置き換える
          const sessionData: Record<string, unknown> = { // Changed any to unknown
            id: currentSession.id || null,
            title: currentSession.title || t("newChat"),
            messages: Array.isArray(currentSession.messages) ? currentSession.messages : [],
            createdAt: Timestamp.fromDate(createdAt)
          };

          // すべてのプロパティがundefinedでないことを確認
          Object.keys(sessionData).forEach(key => {
            if (sessionData[key] === undefined) {
              console.warn(`Property ${key} is undefined in current session, setting to null`);
              sessionData[key] = null;
            }
          });

          console.log("Saving current session:", sessionData);

          await setDoc(currentSessionRef, sessionData);
        } catch (error) {
          console.error("Failed to save current session to Firestore:", error);
          toast.error(t("saveCurrentFailed"));

          // Firestoreに保存失敗した場合のみlocalStorageにフォールバック
          try {
            localStorage.setItem(
              "currentChatSession",
              JSON.stringify(currentSession)
            );
          } catch (localStorageError) {
            console.error(
              "Failed to save current session to localStorage:",
              localStorageError
            );
          }
        }
      } else {
        // Firestore利用不可の場合のみlocalStorageに保存
        try {
          localStorage.setItem(
            "currentChatSession",
            JSON.stringify(currentSession)
          );
        } catch (error) {
          console.error(
            "Failed to save current session to localStorage:",
            error
          );
        }
      }
    };

    saveCurrentSession();
  }, [currentSession, user, t]); // Removed auth/firestore from dependencies

  const createSession = () => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: t("newChat"),
      messages: [],
      createdAt: new Date(),
    };
    setSessions((prev) => [...prev, newSession]);
    setCurrentSession(newSession);
    return newSession;
  };

  const addSession = (session: ChatSession) => {
    setSessions((prev) => [...prev, session]);
    setCurrentSession(session);
  };

  const updateSession = (id: string, updatedSession: ChatSession) => {
    setSessions((prev) =>
      prev.map((session) => (session.id === id ? updatedSession : session))
    );

    // 更新されたセッションIDを追跡
    setModifiedSessionIds(prev => new Set(prev).add(id));

    if (currentSession?.id === id) {
      setCurrentSession(updatedSession);
    }
  };

  const deleteSession = (id: string) => {
    // ローカル状態からセッションを削除
    setSessions((prev) => prev.filter((session) => session.id !== id));
    if (currentSession?.id === id) {
      setCurrentSession(null);
    }

    // Firestoreからセッションを削除 (Firestoreが利用可能な場合)
    if (user && auth && firestore) { // Removed auth/firestore check
      // 型アサーションでnullではないことを明示
      try {
        const sessionDocRef = doc(
          firestore,
          `deni-ai-conversations/${user.uid}/sessions/${id}`
        );
        deleteDoc(sessionDocRef)
          .then(() => {
            console.log(`Session ${id} successfully deleted from Firestore`);
          })
          .catch((error) => {
            console.error(
              `Error deleting session ${id} from Firestore:`,
              error
            );
            toast.error(t("deleteFailed"));
          });
      } catch (error) {
        console.error(`Error preparing to delete session ${id}:`, error);
      }
    }
  };

  // Modify clearAllSessions to be async and handle Firestore/localStorage
  const clearAllSessions = useCallback(async () => {

    // ローカル状態からすべてのセッションを削除
    setSessions([]);
    setCurrentSession(null);
    setModifiedSessionIds(new Set()); // Clear modified set

    // Firestoreからすべてのセッションを削除（Firestoreが利用可能な場合）
    if (user && auth && firestore) { // Removed auth/firestore check
      try {
        const batch = writeBatch(firestore); // Use batch for efficiency

        // Delete all regular sessions
        const sessionsRef = collection(
          firestore,
          `deni-ai-conversations/${user.uid}/sessions`
        );
        const snapshot = await getDocs(sessionsRef);
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));

        // Delete all active sessions
        const activeRef = collection(
          firestore,
          `deni-ai-conversations/${user.uid}/active`
        );
        const activeSnapshot = await getDocs(activeRef);
        activeSnapshot.docs.forEach((doc) => batch.delete(doc.ref));

        await batch.commit(); // Commit the batch delete
        console.log("All sessions successfully deleted from Firestore");
      } catch (error) {
        console.error("Error deleting all sessions from Firestore:", error);
        toast.error(t("deleteAllFailed"));
        // Don't clear localStorage if Firestore fails, might be needed
        return; // Exit early on error
      }
    }

    // Clear localStorage regardless of Firestore status (or only if Firestore succeeded?)
    // Let's clear it always for consistency in the UI action.
    try {
      localStorage.removeItem("chatSessions");
      localStorage.removeItem("currentChatSession");
      console.log("Cleared sessions from localStorage");
    } catch (error) {
      console.error("Error clearing sessions from localStorage:", error);
      // Optionally notify user about localStorage clear failure
    }
  }, [user, t]); // Removed auth/firestore from dependencies


  const selectSession = (id: string) => {
    const session = sessions.find((s) => s.id === id);
    if (session) {
      setCurrentSession(session);
    }
  };

  const getSession = (id: string) =>
    sessions.find((session) => session.id === id);

  const syncSessions = useCallback(async () => {
    // Ensure auth and firestore are initialized
    if (!auth || !firestore) {
      console.error("Firebase auth or firestore is not initialized.");
      toast.error(t("firebaseNotReady"));
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
      toast.error(t("loginRequired"));

      // 認証が必要であることを伝え、再ログインを促す
      toast.error(t("reauthRequired"));
      return;
    }

    try {
      // ユーザーIDにcurrentUserのuidを使用して確実に現在の認証状態を反映
      const uid = currentUser.uid;
      console.log("Syncing sessions for user:", uid);

      // Also check localStorage for any sessions that might need to be synced
      let localStorageSessions: ChatSession[] = [];
      try {
        const savedSessions = localStorage.getItem("chatSessions");
        if (savedSessions && savedSessions !== "[]") {
          const parsedSessions = JSON.parse(savedSessions);
          if (Array.isArray(parsedSessions) && parsedSessions.length > 0) {
            localStorageSessions = parsedSessions;
            console.log(`Found ${localStorageSessions.length} sessions in localStorage to sync`);
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
          console.log(`Adding ${newLocalSessions.length} new sessions from localStorage`);
          allSessions.push(...newLocalSessions);
        }
      }

      // セッションコレクションの参照を作成
      const sessionsRef = collection(
        firestore, // firestore is checked above
        `deni-ai-conversations/${uid}/sessions`
      );
      console.log(
        "Session collection path:",
        `deni-ai-conversations/${uid}/sessions`
      );

      // まず、既存のセッションをFirestoreに保存（更新または作成）
      if (allSessions.length > 0) {
        console.log(
          "Saving sessions to Firestore:",
          allSessions.length,
          "sessions"
        );

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
            title: session.title || t("newChat"),
            messages: Array.isArray(session.messages) ? session.messages : [],
            createdAt: Timestamp.fromDate(createdAt)
          };

          // すべてのプロパティがundefinedでないことを確認
          Object.keys(sessionData).forEach(key => {
            if (sessionData[key] === undefined) {
              console.warn(`Property ${key} is undefined in session ${session.id}, setting to null`);
              sessionData[key] = null;
            }
          });

          console.log("Saving session:", sessionData);

          return setDoc(sessionDoc, sessionData);
        });

        await Promise.all(savePromises);
        console.log("Successfully saved all sessions to Firestore");
      } else {
        console.log("No sessions to save to Firestore");
      }

      // 現在のアクティブセッションを保存
      if (currentSession) {
        const activeSessionRef = doc(
          firestore, // firestore is checked above
          `deni-ai-conversations/${uid}/active/${currentSession.id}`
        );
        console.log("Saving active session:", currentSession.id);

        // createdAtがDate型であることを確認
        const createdAt =
          currentSession.createdAt instanceof Date
            ? currentSession.createdAt
            : new Date(currentSession.createdAt);

        // undefinedを含まないオブジェクトを作成
        const sessionData: Record<string, unknown> = {
          id: currentSession.id || null,
          title: currentSession.title || t("newChat"),
          messages: Array.isArray(currentSession.messages) ? currentSession.messages : [],
          createdAt: Timestamp.fromDate(createdAt)
        };

        // すべてのプロパティがundefinedでないことを確認
        Object.keys(sessionData).forEach(key => {
          if (sessionData[key] === undefined) {
            console.warn(`Property ${key} is undefined in active session, setting to null`);
            sessionData[key] = null;
          }
        });

        console.log("Saving active session with data:", sessionData);
        await setDoc(activeSessionRef, sessionData);
        console.log("Successfully saved active session to Firestore");
      }

      // Firestoreからセッションを読み込む
      const snapshot = await getDocs(sessionsRef);
      console.log("Retrieved", snapshot.docs.length, "sessions from Firestore");

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
          title: data.title || t("newChat"),
          messages: data.messages || [],
          createdAt: createdAt || new Date(),
        };
      }) as ChatSession[];

      setSessions(loadedSessions);
      console.log("Updated local sessions with data from Firestore");

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
          console.log("Found active session:", latestSession.id);
        } else {
          console.log("No valid active session found");
        }
      } else {
        console.log("No active sessions found in Firestore");
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
          console.log("Updated localStorage with latest data from Firebase");
        } catch (error) {
          console.error("Error updating localStorage after sync:", error);
        }
      }

      toast.success(t("syncSuccess"));
    } catch (error) {
      console.error("Failed to sync sessions:", error);
      let errorMessage = t("syncFailed");
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
        console.log(`Exporting ${sessionsToExport.length} sessions from Firestore`);
      } catch (error) {
        console.error("Failed to fetch sessions from Firestore for export:", error);
        toast.error(t("exportFirestoreFailed"));
        // Fallback to localStorage on Firestore error
        try {
          const savedSessions = localStorage.getItem("chatSessions");
          sessionsToExport = savedSessions ? JSON.parse(savedSessions) : [];
          console.log(`Exporting ${sessionsToExport.length} sessions from localStorage (Firestore fallback)`);
        } catch (localError) {
          console.error("Failed to read localStorage for export fallback:", localError);
          toast.error(t("exportLocalFailed"));
          sessionsToExport = []; // Ensure it's an empty array on double failure
        }
      }
    } else {
      // Firestore not available, use localStorage
      try {
        const savedSessions = localStorage.getItem("chatSessions");
        sessionsToExport = savedSessions ? JSON.parse(savedSessions) : [];
        console.log(`Exporting ${sessionsToExport.length} sessions from localStorage`);
      } catch (error) {
        console.error("Failed to read sessions from localStorage for export:", error);
        toast.error(t("exportLocalFailed"));
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
      console.log(`Attempting to import ${importedSessions.length} sessions`);
    } catch (error) {
      console.error("Failed to parse imported JSON data:", error);
      toast.error(t("importParseFailed"), {
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
        console.log(`Successfully imported ${importedSessions.length} sessions to Firestore`);
        toast.success(t("importFirestoreSuccess"));

        // Reload sessions from Firestore to update UI state
        await syncSessions(); // Use syncSessions to reload and update state

      } catch (error) {
        console.error("Failed to import sessions to Firestore:", error);
        toast.error(t("importFirestoreFailed"), {
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
        console.log(`Successfully imported ${importedSessions.length} sessions to localStorage`);
        toast.success(t("importLocalSuccess"));
      } catch (error) {
        console.error("Failed to import sessions to localStorage:", error);
        toast.error(t("importLocalFailed"), {
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
