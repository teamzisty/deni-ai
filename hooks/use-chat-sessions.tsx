"use client";

import { UIMessage } from "ai";
import { useTransitionRouter } from "next-view-transitions";
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
import { firestore } from "@/lib/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface ChatSessionsContextValue {
  sessions: ChatSession[];
  createSession: () => ChatSession;
  addSession: (session: ChatSession) => void;
  updateSession: (id: string, updatedSession: ChatSession) => void;
  deleteSession: (id: string) => void;
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
  selectSession: (id: string) => void;
  getSession: (id: string) => ChatSession | undefined;
}

const ChatSessionsContext = createContext<ChatSessionsContextValue | undefined>(
  undefined
);

export function ChatSessionsProvider({ children }: { children: ReactNode }) {
  const router = useTransitionRouter();
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const savedSessions = localStorage.getItem("chatSessions");
    return savedSessions ? JSON.parse(savedSessions) : [];
  });
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    () => {
      const savedCurrentSession = localStorage.getItem("currentChatSession");
      return savedCurrentSession ? JSON.parse(savedCurrentSession) : null;
    }
  );

  useEffect(() => {
    try {
      localStorage.setItem("chatSessions", JSON.stringify(sessions));
    } catch (error) {
      if (error instanceof Error && error.name === "QuotaExceededError") {
        // If storage is full, remove oldest sessions until it fits
        toast.error(
          "チャットの履歴がいっぱいです。古いチャットを削除してください。"
        );
      }
    }
  }, [sessions]);
  useEffect(() => {
    localStorage.setItem("currentChatSession", JSON.stringify(currentSession));
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
    if (user) {
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

  const { user } = useAuth();

  const syncSessions = async () => {
    if (!user) return;

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
