"use client";

import { useChatSessions, ChatSession } from "@/hooks/use-chat-sessions";
import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Loading } from "@/components/loading";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import React, { useState, useEffect } from "react";
import { modelDescriptions } from "@/lib/modelDescriptions";
import logger from "@/utils/logger";
import Chat from "@/components/Chat";
import { createClient } from "@/lib/supabase/client";

const ChatPage: React.FC = () => {
  const {
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
  const [currentSessionData, setCurrentSessionData] = useState<
    ChatSession | undefined
  >(undefined);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [initialMessage, setInitialMessage] = useState<string | null>(null);

  // Create Supabase client instance
  const supabase = createClient();
  useEffect(() => {
    if (user && supabase) {
      // Get Supabase session token instead of user.id
      const getAuthToken = async () => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.access_token) {
            setAuthToken(`Bearer ${session.access_token}`);
          }
        } catch (error) {
          console.error("Failed to get session token:", error);
        }
      };
      getAuthToken();
    }
  }, [user]);

  // Extract initial message from URL parameters
  useEffect(() => {
    const messageParam = searchParams.get("message");
    if (messageParam) {
      setInitialMessage(decodeURIComponent(messageParam));
    }
  }, [searchParams]);

  useEffect(() => {
    if (
      isAuthLoading ||
      isSessionsLoading ||
      !isSupabaseLoaded ||
      isRedirecting
    ) {
      return;
    }

    const session = getSession(params.id);

    if (!session) {
      setIsRedirecting(true);
      router.push("/");
      return;
    }

    // Avoid unnecessary re-renders & requests
    if (currentSessionData?.id !== session.id) {
      setCurrentSessionData(session);
      logger.info("ChatPage Init", "Loaded Session Data");
    }
  }, [
    isAuthLoading,
    isSessionsLoading,
    isSupabaseLoaded,
    router,
    params.id,
    isRedirecting,
    currentSessionData?.id,
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

  if (isAuthLoading || isSessionsLoading || !currentSessionData) {
    return <Loading />;
  }

  return (
    <main className="flex flex-col w-full mr-0 p-4 items-center overflow-hidden justify-between h-[100dvh]">
      <Chat
        sessionId={params.id}
        initialSessionData={currentSessionData}
        user={user}
        authToken={authToken}
        updateSession={updateSession}
        initialMessage={initialMessage}
      />
    </main>
  );
};

export default ChatPage;
