"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@workspace/ui/lib/utils";
import { Loader, Trash2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { useRouter } from "@/i18n/navigation";
import { Footer } from "@/components/footer";
import { auth } from "@workspace/firebase-config/client";
import { Loading } from "@/components/loading";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
const ChatApp: React.FC = () => {
  const t = useTranslations();
  const { createSession, clearAllSessions, sessions, isLoading: isSessionsLoading } = useChatSessions();
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
    if (!auth) {
      setIsLoading(false);
      return;
    };
    
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

  if (isLoading || isSessionsLoading) {
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

          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            <Button onClick={handleNewSession} size="lg">
              {creating ? (
                <>
                  <Loader className="animate-spin mr-2" /> {t("home.creating")}
                </>
              ) : (
                t("home.newChat")
              )}
            </Button>

            {sessions.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="lg">
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("home.clearHistory")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("home.clearHistoryConfirmTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("home.clearHistoryConfirmDescription")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        clearAllSessions();
                        toast.success(t("home.historyCleared"));
                      }}
                    >
                      {t("home.clearHistoryConfirm")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </main>
  );
};

export default ChatApp;
