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
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface DevSessionsContextValue {
  sessions: DevSession[];
  createSession: () => DevSession;
  addSession: (session: DevSession) => void;
  updateSession: (id: string, updatedSession: DevSession) => void;
  deleteSession: (id: string) => void;
  clearAllSessions: () => Promise<void>;
  selectSession: (id: string) => void;
  getSession: (id: string) => DevSession | undefined;
  isLoading: boolean;
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

const DEV_SESSIONS_KEY = "devSessions";
const CURRENT_DEV_SESSION_KEY = "currentDevSession";

export function DevSessionsProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<DevSession[]>([]);
  const [currentSession, setCurrentSession] = useState<DevSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslations();

  // Save sessions to localStorage
  const saveToLocalStorage = useCallback((sessionsToSave: DevSession[], currentSessionToSave: DevSession | null) => {
    try {
      localStorage.setItem(DEV_SESSIONS_KEY, JSON.stringify(sessionsToSave));
      if (currentSessionToSave) {
        localStorage.setItem(CURRENT_DEV_SESSION_KEY, JSON.stringify(currentSessionToSave));
      } else {
        localStorage.removeItem(CURRENT_DEV_SESSION_KEY);
      }
    } catch (error) {
      console.error("Failed to save dev sessions to localStorage:", error);
      toast.error(
        t("devSessions.localStorageSaveFailed") || "Failed to save sessions"
      );
    }
  }, [t]);

  // Load sessions from localStorage
  useEffect(() => {
    const loadSessionsFromLocalStorage = () => {
      try {
        setIsLoading(true);
        
        const savedSessions = localStorage.getItem(DEV_SESSIONS_KEY);
        if (savedSessions && savedSessions !== "[]") {
          const parsedSessions = JSON.parse(savedSessions);
          if (Array.isArray(parsedSessions) && parsedSessions.length > 0) {
            // Convert date strings to Date objects
            const sessionsWithDates = parsedSessions.map(session => ({
              ...session,
              createdAt: new Date(session.createdAt)
            }));
            setSessions(sessionsWithDates);
          }
        }

        const savedCurrentSession = localStorage.getItem(CURRENT_DEV_SESSION_KEY);
        if (savedCurrentSession && savedCurrentSession !== "null") {
          const parsed = JSON.parse(savedCurrentSession);
          setCurrentSession({
            ...parsed,
            createdAt: new Date(parsed.createdAt)
          });
        }
      } catch (error) {
        console.error("Failed to load dev sessions from localStorage:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSessionsFromLocalStorage();
  }, []);

  // Save sessions when they change
  useEffect(() => {
    if (sessions.length > 0) {
      saveToLocalStorage(sessions, currentSession);
    }
  }, [sessions, currentSession, saveToLocalStorage]);

  const createSession = useCallback(() => {
    const newSession: DevSession = {
      id: crypto.randomUUID(),
      title: t("devSessions.newSession") || "New Dev Session",
      messages: [],
      createdAt: new Date(),
    };

    const updatedSessions = [...sessions, newSession];
    setSessions(updatedSessions);
    setCurrentSession(newSession);
    saveToLocalStorage(updatedSessions, newSession);

    return newSession;
  }, [sessions, t, saveToLocalStorage]);

  const addSession = useCallback((session: DevSession) => {
    const updatedSessions = [...sessions, session];
    setSessions(updatedSessions);
    saveToLocalStorage(updatedSessions, currentSession);
  }, [sessions, currentSession, saveToLocalStorage]);

  const updateSession = useCallback((id: string, updatedSession: DevSession) => {
    // Validate and ensure createdAt is a Date object before updating state
    const validatedSession = {
      ...updatedSession,
      createdAt: updatedSession.createdAt instanceof Date ? updatedSession.createdAt : new Date(updatedSession.createdAt),
    };

    const updatedSessions = sessions.map((session) =>
      session.id === id ? validatedSession : session
    );
    setSessions(updatedSessions);

    // Update current session if it's the one being updated
    let newCurrentSession = currentSession;
    if (currentSession?.id === id) {
      newCurrentSession = validatedSession;
      setCurrentSession(newCurrentSession);
    }

    saveToLocalStorage(updatedSessions, newCurrentSession);
  }, [sessions, currentSession, saveToLocalStorage]);

  const deleteSession = useCallback((id: string) => {
    const updatedSessions = sessions.filter((session) => session.id !== id);
    setSessions(updatedSessions);

    let newCurrentSession = currentSession;
    if (currentSession?.id === id) {
      // Find the latest session to set as current
      newCurrentSession = updatedSessions.length > 0
        ? updatedSessions.reduce((latest, session) =>
            latest.createdAt > session.createdAt ? latest : session
          )
        : null;
      setCurrentSession(newCurrentSession);
    }

    saveToLocalStorage(updatedSessions, newCurrentSession);
    toast.success(
      t("devSessions.sessionDeletedSuccess") || "Session deleted"
    );
  }, [sessions, currentSession, t, saveToLocalStorage]);

  const clearAllSessions = useCallback(async () => {
    setSessions([]);
    setCurrentSession(null);
    localStorage.removeItem(DEV_SESSIONS_KEY);
    localStorage.removeItem(CURRENT_DEV_SESSION_KEY);
    toast.success(
      t("devSessions.clearAllSuccess") || "All dev sessions cleared"
    );
    return Promise.resolve();
  }, [t]);

  const selectSession = useCallback((id: string) => {
    const selected = sessions.find((session) => session.id === id);
    if (selected) {
      setCurrentSession(selected);
      saveToLocalStorage(sessions, selected);
    }
  }, [sessions, saveToLocalStorage]);

  const getSession = useCallback((id: string) =>
    sessions.find((session) => session.id === id)
  , [sessions]);

  // Sync sessions between tabs using localStorage events
  const handleStorageChange = useCallback((event: StorageEvent) => {
    if (event.key === DEV_SESSIONS_KEY) {
      try {
        const newSessions = event.newValue ? JSON.parse(event.newValue) : [];
         // Ensure createdAt is a Date object
        const loadedSessions = newSessions.map((s: any) => ({
          ...s,
          createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
        }));
        setSessions(loadedSessions);
      } catch (error) {
        console.error("Error parsing dev sessions from storage event:", error);
      }
    } else if (event.key === CURRENT_DEV_SESSION_KEY) {
      try {
        const newCurrentSession = event.newValue ? JSON.parse(event.newValue) : null;
         // Ensure createdAt is a Date object
        const currentSessionData = newCurrentSession ? {
            ...newCurrentSession,
            createdAt: newCurrentSession.createdAt ? new Date(newCurrentSession.createdAt) : new Date(),
        } : null;
        setCurrentSession(currentSessionData);
      } catch (error) {
        console.error("Error parsing current dev session from storage event:", error);
      }
    }
  }, []);

  // Add/remove storage event listener
  useEffect(() => {
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [handleStorageChange]);

  const value: DevSessionsContextValue = {
    sessions,
    createSession,
    addSession,
    updateSession,
    deleteSession,
    clearAllSessions,
    selectSession,
    getSession,
    isLoading,
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
    throw new Error(
      "useDevSessions must be used within a DevSessionsProvider"
    );
  }
  return context;
} 