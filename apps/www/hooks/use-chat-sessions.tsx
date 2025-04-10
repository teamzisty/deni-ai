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
  getDoc,
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
  const router = useRouter();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load sessions from Firestore when user is authenticated
  useEffect(() => {
    const loadSessionsFromFirestore = async () => {
      if (!user || !firestore) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const sessionsRef = collection(firestore, `deni-ai-conversations/${user.uid}/sessions`);
        const snapshot = await getDocs(sessionsRef);
        const loadedSessions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as ChatSession[];

        setSessions(loadedSessions);
      } catch (error) {
        console.error("Failed to load sessions from Firestore:", error);
        toast.error("Failed to load chat sessions");
      } finally {
        setIsLoading(false);
      }
    };

    loadSessionsFromFirestore();
  }, [user]);

  // Fallback to localStorage when user is not authenticated
  useEffect(() => {
    if (user) {
      setIsLoading(false);
      return;
    } // Skip if user is authenticated

    try {
      setIsLoading(true);
      const savedSessions = localStorage.getItem("chatSessions");
      if (savedSessions && savedSessions !== "[]") {
        const parsedSessions = JSON.parse(savedSessions);
        if (Array.isArray(parsedSessions) && parsedSessions.length > 0) {
          setSessions(parsedSessions);
        }
      }

      const savedCurrentSession = localStorage.getItem("currentChatSession");
      if (savedCurrentSession && savedCurrentSession !== "null") {
        setCurrentSession(JSON.parse(savedCurrentSession));
      }
    } catch (error) {
      console.error("Failed to load sessions from localStorage:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Save sessions to Firestore when user is authenticated
  useEffect(() => {
    const saveSessionsToFirestore = async () => {
      if (!user || !firestore || sessions.length === 0) return;

      try {
        const sessionsRef = collection(firestore, `deni-ai-conversations/${user.uid}/sessions`);
        
        // 既存のセッションを取得
        const snapshot = await getDocs(sessionsRef);
        const existingIds = new Set(snapshot.docs.map(doc => doc.id));
        
        // 削除するセッションと追加/更新するセッションを分離
        const sessionsToDelete = Array.from(existingIds).filter(id => 
          !sessions.some(session => session.id === id)
        );
        
        // 削除処理
        const deletePromises = sessionsToDelete.map(id => 
          deleteDoc(doc(sessionsRef, id))
        );
        
        // 追加/更新処理
        const savePromises = sessions.map(session => {
          const docRef = doc(sessionsRef, session.id);
          // createdAtがDate型であることを確認
          const createdAt = session.createdAt instanceof Date 
            ? session.createdAt 
            : new Date(session.createdAt);
            
          // undefined値を除外し、nullに置き換える
          const sessionData = {
            id: session.id || null,
            title: session.title || "New Chat",
            messages: session.messages || [],
            createdAt: Timestamp.fromDate(createdAt) || Timestamp.now(),
          };
          
          // データの検証
          if (sessionData.id === undefined || sessionData.title === undefined || sessionData.messages === undefined) {
            console.error("Invalid session data:", sessionData);
            return Promise.resolve(); // エラーをスキップ
          }
          
          return setDoc(docRef, sessionData);
        });
        
        // すべての処理を実行
        await Promise.all([...deletePromises, ...savePromises]);
      } catch (error) {
        console.error("Failed to save sessions to Firestore:", error);
        toast.error("Failed to save chat sessions");
      }
    };

    saveSessionsToFirestore();
  }, [sessions, user]);

  // Save current session to Firestore when user is authenticated
  useEffect(() => {
    const saveCurrentSessionToFirestore = async () => {
      if (!user || !firestore || !currentSession) return;

      try {
        // 修正: deni-ai-conversations/[uid]/sessions/active のパス構造を使用
        const currentSessionRef = doc(firestore, `deni-ai-conversations/${user.uid}/sessions/active`);
        // createdAtがDate型であることを確認
        const createdAt = currentSession.createdAt instanceof Date 
          ? currentSession.createdAt 
          : new Date(currentSession.createdAt);
          
        // undefined値を除外し、nullに置き換える
        const sessionData = {
          id: currentSession.id || null,
          title: currentSession.title || "New Chat",
          messages: currentSession.messages || [],
          createdAt: Timestamp.fromDate(createdAt) || Timestamp.now(),
        };
        
        // データの検証
        if (sessionData.id === undefined || sessionData.title === undefined || sessionData.messages === undefined) {
          console.error("Invalid session data:", sessionData);
          toast.error("Invalid session data");
          return;
        }
        
        await setDoc(currentSessionRef, sessionData);
      } catch (error) {
        console.error("Failed to save current session to Firestore:", error);
        toast.error("Failed to save current chat session");
      }
    };

    saveCurrentSessionToFirestore();
  }, [currentSession, user]);

  // Fallback to localStorage when user is not authenticated
  useEffect(() => {
    if (user) return; // Skip if user is authenticated

    try {
      if (sessions.length > 0) {
        localStorage.setItem("chatSessions", JSON.stringify(sessions));
      }
      if (currentSession) {
        localStorage.setItem("currentChatSession", JSON.stringify(currentSession));
      }
    } catch (error) {
      console.error("Failed to save sessions to localStorage:", error);
    }
  }, [sessions, currentSession, user]);

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
    setSessions((prev) => [...prev, session]);
    setCurrentSession(session);
  };

  const updateSession = (id: string, updatedSession: ChatSession) => {
    setSessions((prev) =>
      prev.map((session) => (session.id === id ? updatedSession : session))
    );
    if (currentSession?.id === id) {
      setCurrentSession(updatedSession);
    }
  };

  const deleteSession = (id: string) => {
    setSessions((prev) => prev.filter((session) => session.id !== id));
    if (currentSession?.id === id) {
      setCurrentSession(null);
    }
  };

  const clearAllSessions = () => {
    setSessions([]);
    setCurrentSession(null);
  };

  const selectSession = (id: string) => {
    const session = sessions.find((s) => s.id === id);
    if (session) {
      setCurrentSession(session);
    }
  };

  const getSession = (id: string) => sessions.find((session) => session.id === id);

  const syncSessions = async () => {
    if (!user || !firestore) {
      toast.error("You need to be logged in to sync sessions");
      return;
    }

    try {
      const sessionsRef = collection(firestore, `deni-ai-conversations/${user.uid}/sessions`);
      const snapshot = await getDocs(sessionsRef);
      const loadedSessions = snapshot.docs.map(doc => {
        const data = doc.data();
        // createdAtフィールドの変換を安全に行う
        let createdAt: Date;
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
          createdAt = data.createdAt.toDate();
        } else if (data.createdAt && typeof data.createdAt === 'object') {
          createdAt = new Date(data.createdAt.seconds * 1000);
        } else {
          createdAt = new Date();
        }
        
        // undefined値を除外し、デフォルト値を設定
        return {
          id: doc.id,
          title: data.title || "New Chat",
          messages: data.messages || [],
          createdAt: createdAt,
        };
      }) as ChatSession[];

      setSessions(loadedSessions);
      
      // 修正: deni-ai-conversations/[uid]/sessions/active のパス構造を使用
      const currentSessionRef = doc(firestore, `deni-ai-conversations/${user.uid}/sessions/active`);
      const currentSessionDoc = await getDoc(currentSessionRef);
      
      if (currentSessionDoc.exists()) {
        const data = currentSessionDoc.data();
        let createdAt: Date;
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
          createdAt = data.createdAt.toDate();
        } else if (data.createdAt && typeof data.createdAt === 'object') {
          createdAt = new Date(data.createdAt.seconds * 1000);
        } else {
          createdAt = new Date();
        }
        
        // undefined値を除外し、デフォルト値を設定
        const currentSession: ChatSession = {
          id: data.id || currentSessionDoc.id,
          title: data.title || "New Chat",
          messages: data.messages || [],
          createdAt: createdAt,
        };
        
        setCurrentSession(currentSession);
      }
      
      toast.success("Chat sessions synced successfully");
    } catch (error) {
      console.error("Failed to sync sessions:", error);
      toast.error("Failed to sync chat sessions");
    }
  };

  const value = {
    sessions,
    createSession,
    addSession,
    updateSession,
    deleteSession,
    clearAllSessions,
    selectSession,
    getSession,
    syncSessions,
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
