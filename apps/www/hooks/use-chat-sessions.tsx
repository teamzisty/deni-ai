"use client";

import { UIMessage } from "ai";
import { useRouter } from "@/i18n/navigation";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { auth, firestore } from "@repo/firebase-config/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface ChatSessionsContextValue {
  sessions: ChatSession[];
  createSession: () => ChatSession;
  addSession: (session: ChatSession) => void;
  updateSession: (id: string, updatedSession: ChatSession) => void;
  deleteSession: (id: string) => void;
  clearAllSessions: () => void;
  selectSession: (id: string) => void;
  getSession: (id: string) => ChatSession | undefined;
  syncSessions: () => Promise<void>;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: UIMessage[];
  createdAt: Date;
}

interface ChatSessionsContextValue {
  sessions: ChatSession[];
  createSession: () => ChatSession;
  addSession: (session: ChatSession) => void;
  updateSession: (id: string, updatedSession: ChatSession) => void;
  deleteSession: (id: string) => void;
  clearAllSessions: () => void;
  selectSession: (id: string) => void;
  getSession: (id: string) => ChatSession | undefined;
}

const ChatSessionsContext = createContext<ChatSessionsContextValue | undefined>(
  undefined
);

export function ChatSessionsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null
  );

  // クライアントサイドでのみlocalStorageからデータを読み込む
  useEffect(() => {
    try {
      // 言語変更時に一時保存されたデータがあるか確認
      const tempSessions = sessionStorage.getItem("temp_chatSessions");
      const tempCurrentSession = sessionStorage.getItem("temp_currentSession");

      // 一時保存データがある場合はそれを使用し、LocalStorageに保存
      if (tempSessions && tempSessions !== "[]") {
        const parsedSessions = JSON.parse(tempSessions);
        if (Array.isArray(parsedSessions) && parsedSessions.length > 0) {
          setSessions(parsedSessions);
          localStorage.setItem("chatSessions", tempSessions);
        }
        // 使用後は削除
        sessionStorage.removeItem("temp_chatSessions");
      } else {
        // 一時保存データがない場合はLocalStorageから読み込む
        const savedSessions = localStorage.getItem("chatSessions");
        if (savedSessions && savedSessions !== "[]") {
          // 空の配列の場合は読み込まない
          const parsedSessions = JSON.parse(savedSessions);
          if (Array.isArray(parsedSessions) && parsedSessions.length > 0) {
            setSessions(parsedSessions);
          }
        }
      }

      // 現在のセッションも同様に処理
      if (tempCurrentSession && tempCurrentSession !== "null") {
        setCurrentSession(JSON.parse(tempCurrentSession));
        localStorage.setItem("currentChatSession", tempCurrentSession);
        sessionStorage.removeItem("temp_currentSession");
      } else {
        const savedCurrentSession = localStorage.getItem("currentChatSession");
        if (savedCurrentSession && savedCurrentSession !== "null") {
          setCurrentSession(JSON.parse(savedCurrentSession));
        }
      }
    } catch (error) {
      console.error("Failed to load sessions from localStorage:", error);
    }
  }, []);

  useEffect(() => {
    try {
      // セッションが空でない場合のみ保存する
      if (sessions.length > 0) {
        try {
          localStorage.setItem("chatSessions", JSON.stringify(sessions));
        } catch (storageError) {
          if (storageError instanceof Error && storageError.name === "QuotaExceededError") {
            // ストレージがいっぱいの場合、古いセッションを自動的に削除
            const sortedSessions = [...sessions].sort((a, b) =>
              a.createdAt.getTime() - b.createdAt.getTime()
            );
            
            // 最も古い25%のセッションを削除
            const sessionsToRemove = Math.max(1, Math.floor(sortedSessions.length * 0.25));
            const remainingSessions = sortedSessions.slice(sessionsToRemove);
            
            // 削除後のセッションを保存
            setSessions(remainingSessions);
            localStorage.setItem("chatSessions", JSON.stringify(remainingSessions));
            
            toast.success(
              `チャットの履歴がいっぱいだったため、古い${sessionsToRemove}件のチャットを自動的に削除しました。`
            );
          } else {
            throw storageError; // 他のエラーは外側のcatchで処理
          }
        }
      } else {
        // 現在のLocalStorageの値を確認
        const currentSessions = localStorage.getItem("chatSessions");
        // 現在の値が存在し、空の配列でない場合は上書きしない
        if (!currentSessions || currentSessions === "[]") {
          localStorage.setItem("chatSessions", JSON.stringify(sessions));
        }
      }
    } catch (error) {
      console.error("Failed to save sessions to localStorage:", error);
    }
  }, [sessions]);
  useEffect(() => {
    try {
      if (currentSession) {
        localStorage.setItem(
          "currentChatSession",
          JSON.stringify(currentSession)
        );
      } else {
        // 現在のLocalStorageの値を確認
        const currentSessionValue = localStorage.getItem("currentChatSession");
        // 現在の値が存在し、nullでない場合は上書きしない
        if (!currentSessionValue || currentSessionValue === "null") {
          localStorage.setItem(
            "currentChatSession",
            JSON.stringify(currentSession)
          );
        }
      }
    } catch (error) {
      console.error("Failed to save current session to localStorage:", error);
    }
  }, [currentSession]);

  const createSession = () => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
    };
    setSessions((prev) => [...prev, newSession]);
    setCurrentSession(newSession);
    return newSession;
  };

  const addSession = (session: ChatSession) => {
    const newSession: ChatSession = {
      id: session.id,
      title: session.title,
      messages: session.messages,
      createdAt: session.createdAt,
    };
    setSessions((prev) => [...prev, newSession]);
    setCurrentSession(newSession);
    return newSession;
  };

  const getSession = (id: string) =>
    sessions.find((session) => session.id === id);

  const deleteSession = async (id: string) => {
    if (user && auth && firestore) {
      try {
        const sessionRef = doc(
          firestore,
          `deni-ai-conversations/${user.uid}/sessions/${id}`
        );
        await deleteDoc(sessionRef);
      } catch (error) {
        console.error("Failed to delete session from Firestore:", error);
      }
    }
    setSessions((prev) => prev.filter((session) => session.id !== id));
    if (currentSession?.id === id) {
      setCurrentSession(null);
    }
  };

  const clearAllSessions = () => {
    // localStorageからすべてのセッションを削除
    localStorage.removeItem("chatSessions");
    localStorage.removeItem("currentChatSession");
    
    // stateをクリア
    setSessions([]);
    setCurrentSession(null);
    
    // Firestoreからも削除（ログインしている場合）
    if (user && auth && firestore) {
      try {
        const sessionsRef = collection(
          firestore,
          `deni-ai-conversations/${user.uid}/sessions`
        );
        getDocs(sessionsRef).then((snapshot) => {
          snapshot.docs.forEach((doc) => {
            deleteDoc(doc.ref);
          });
        });
      } catch (error) {
        console.error("Failed to delete sessions from Firestore:", error);
      }
    }
  };

  const selectSession = (id: string) => {
    const session = sessions.find((s) => s.id === id);
    if (session) {
      router.push(`/chat/${id}`);
    }
  };

  const updateSession = (id: string, updatedSession: ChatSession) => {
    setSessions((prev) =>
      prev.map((session) => (session.id === id ? updatedSession : session))
    );
  };

  const syncSessions = async () => {
    if (!user) return;
    if (!firestore) return;
    if (!auth) return;

    try {
      // Firestoreからセッションを取得
      const sessionsRef = collection(
        firestore,
        `deni-ai-conversations/${user.uid}/sessions`
      );
      const snapshot = await getDocs(sessionsRef);
      const firestoreSessions = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate()
              : new Date(data.createdAt),
        };
      }) as ChatSession[];

      // マージ処理: FirestoreとローカルのセッションをIDで比較
      const mergedSessions = [...sessions];

      // Firestoreのセッションを追加または更新
      firestoreSessions.forEach((firestoreSession) => {
        const localIndex = mergedSessions.findIndex(
          (s) => s.id === firestoreSession.id
        );
        if (localIndex === -1) {
          // ローカルに存在しないセッションを追加
          mergedSessions.push(firestoreSession);
        } else {
          // タイムスタンプを比較して新しい方を採用
          const localSession = mergedSessions[localIndex];
          if (
            localSession &&
            firestoreSession.createdAt > localSession.createdAt
          ) {
            mergedSessions[localIndex] = firestoreSession;
          }
        }
      });

      // マージされたセッションをFirestoreに保存
      const savePromises = mergedSessions.map(async (session) => {
        if (!firestore) return;
        if (!user) return;
        if (!auth) return;

        const sessionRef = doc(
          firestore,
          `deni-ai-conversations/${user.uid}/sessions/${session.id}`
        );
        await setDoc(sessionRef, {
          ...session,
          createdAt: Timestamp.fromDate(session.createdAt),
        });
      });

      await Promise.all(savePromises);

      // マージされたセッションをローカルに保存
      setSessions(mergedSessions);
    } catch (error) {
      console.error("Failed to sync sessions:", error);
    }
  };
  const value: ChatSessionsContextValue = {
    sessions,
    createSession,
    addSession,
    getSession,
    deleteSession,
    clearAllSessions,
    selectSession,
    updateSession,
    syncSessions,
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
