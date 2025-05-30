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
import { supabase } from "@workspace/supabase-config/client";

const ChatPage: React.FC = () => {  const {
    updateSession,
    getSession,
    isLoading: isSessionsLoading,
    isSupabaseLoaded,
    sessions,
  } = useChatSessions();
  const { user, isLoading: isAuthLoading } = useAuth();

  const t = useTranslations();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [currentSessionData, setCurrentSessionData] = useState<ChatSession | undefined>(undefined);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const getCurrentSession = useCallback(() => {
    if (isSessionsLoading) {
      return null;
    }
    const session = getSession(params.id);
    return session;
  }, [getSession, params.id, isSessionsLoading, sessions?.length]);  useEffect(() => {
    if (user && supabase) {
      // Get Supabase session token instead of user.id
      const getAuthToken = async () => {
        try {
          const { data: { session } } = await supabase!.auth.getSession();
          if (session?.access_token) {
            setAuthToken(`Bearer ${session.access_token}`);
          }
        } catch (error) {
          console.error('Failed to get session token:', error);
        }
      };
      getAuthToken();
    }
  }, [user]);

  useEffect(() => {
    if (isAuthLoading || isSessionsLoading || !isSupabaseLoaded || sessionChecked || isRedirecting) {
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
    }, 500);    return () => clearTimeout(timer);
  }, [
    isAuthLoading,
    isSessionsLoading,
    isSupabaseLoaded,
    getCurrentSession,
    router,
    params.id,
    isRedirecting,
    sessionChecked,
  ]);
  
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/login");
      return;
    }

    if (!isAuthLoading && user) {
      if (!user.user_metadata?.display_name && !user.email) {
        router.push("/getting-started");
        return;
      }
    }
  }, [isAuthLoading, user, router]);

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
        initialImage={initialImageParam || undefined}        initialMessage={initialMessageParam || undefined}
        updateSession={updateSession}
      />
    </main>
  );
};

export default ChatPage;
