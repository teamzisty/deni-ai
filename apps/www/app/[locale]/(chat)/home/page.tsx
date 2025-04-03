"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Loader } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { useRouter } from "@/i18n/navigation";
import { Footer } from "@/components/footer";
import { auth } from "@repo/firebase-config/client";
import { Loading } from "@/components/loading";
import { useTranslations } from "next-intl";

const ChatApp: React.FC = () => {
  const t = useTranslations();
  const { createSession } = useChatSessions();
  const [creating, setCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const handleNewSession = () => {
    setCreating(true);

    const randomNumber = Math.floor(Math.random() * (750 - 350 + 1)) + 350;

    setTimeout(() => {
      const session = createSession();

      router.push(`/chat/${session.id}`);
    }, randomNumber);
  };

  useEffect(() => {
    const event = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setIsLoading(false);
    });
    return () => {
      event();
    };
  }, [router]);

  if (isLoading) {
    return (
      <Loading />
    );
  }

  return (
    <main className="w-full flex">
      {/* Main Chat Area */}
      <div
        className={cn(
          "flex flex-col flex-1 w-full md:w-9/12 mr-0 md:mr-16 ml-3 p-4 h-screen"
        )}
      >
        <br />

        {/* Input Area */}
        <div className="flex items-center flex-col w-full md:w-7/12 m-auto">
          <h1 className="m-auto text-xl lg:text-3xl mb-1 font-bold">
            {t("home.title")}
          </h1>
          <p className="text-muted-foreground mb-2">
            {t("home.subtitle")}
          </p>

          <Button onClick={handleNewSession} size="lg">
            {creating ? (
              <>
                <Loader className="animate-spin" /> {t("home.creating")}
              </>
            ) : (
              t("home.newChat")
            )}
          </Button>
        </div>

        <Footer />
      </div>
    </main>
  );
};

export default ChatApp;
