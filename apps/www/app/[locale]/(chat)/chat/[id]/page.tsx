"use client";

import { useChatSessions, ChatSession } from "@/hooks/use-chat-sessions";
import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Loading } from "@/components/loading";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import React, { useState, useEffect, useCallback } from "react";
import { modelDescriptions } from "@/lib/modelDescriptions";
import logger from "@/utils/logger";
import Chat from "@/components/Chat";

const ChatPage: React.FC = () => {
  const {
    updateSession,
    getSession,
    isLoading: isSessionsLoading,
    isFirestoreLoaded,
    sessions,
  } = useChatSessions();
  const { user, isLoading: isAuthLoading, auth } = useAuth();

  const t = useTranslations();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [currentSessionData, setCurrentSessionData] = useState<ChatSession | undefined>(undefined);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [paramsProcessed, setParamsProcessed] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const getCurrentSession = useCallback(() => {
    if (isSessionsLoading) {
      return null;
    }
    const session = getSession(params.id);
    return session;
  }, [getSession, params.id, isSessionsLoading, sessions?.length]);

  useEffect(() => {
    if (user) {
      user.getIdToken().then(setAuthToken);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthLoading || isSessionsLoading || !isFirestoreLoaded || sessionChecked || isRedirecting) {
      return;
    }

    const timer = setTimeout(() => {
      const session = getCurrentSession();

      if (!session) {
        setIsRedirecting(true);
        router.push("/home");
        return;
      }

      setCurrentSessionData(session);
      setSessionChecked(true);
      logger.info("ChatPage Init", "Loaded Session Data");
    }, 500);

    return () => clearTimeout(timer);
  }, [
    isAuthLoading,
    isSessionsLoading,
    isFirestoreLoaded,
    getCurrentSession,
    router,
    params.id,
    isRedirecting,
    sessionChecked,
  ]);

  useEffect(() => {
    if (!auth) return;

    if (!isAuthLoading && !user) {
      router.push("/login");
      return;
    }

    if (!isAuthLoading && user) {
      if (!user.displayName) {
        router.push("/getting-started");
        return;
      }
    }
  }, [isAuthLoading, user, router, auth]);

  const initialModelParam = searchParams.get("model");
  const initialImageParam = searchParams.get("img");
  const initialMessageParam = searchParams.get("i");

  const validatedInitialModel = initialModelParam && modelDescriptions[initialModelParam]
    ? initialModelParam
    : undefined;

  if (isAuthLoading || isSessionsLoading || !sessionChecked || !currentSessionData) {
    return <Loading />;
  }

  return (
    <main className="flex flex-col w-full mr-0 p-4 items-center overflow-hidden justify-between h-[100dvh]">
      <Chat
        sessionId={params.id}
        initialSessionData={currentSessionData}
        user={user}
        authToken={authToken}
        initialModel={validatedInitialModel}
        initialImage={initialImageParam || undefined}
        initialMessage={initialMessageParam || undefined}
        updateSession={updateSession}
        auth={auth}
      />
    </main>
  );
};

export default ChatPage;
