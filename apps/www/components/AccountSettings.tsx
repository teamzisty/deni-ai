"use client";

import { toast } from "sonner";
import { Button } from "@repo/ui/components/button";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, Link } from "@/i18n/navigation";
import { Loading } from "@/components/loading";
import { Switch } from "@repo/ui/components/switch";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { useTranslations } from "next-intl";
import { auth, firestore } from "@repo/firebase-config/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { ArrowRight } from "lucide-react";

export default function AccountSettings() {
  const { user, isLoading } = useAuth();
  const { syncSessions, isLoading: isSessionsLoading } = useChatSessions();
  const [isLogged, setIsLogged] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  const t = useTranslations();
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();

  const handleSync = async () => {
    // Check if Firebase auth is initialized
    if (!auth) {
      toast.error(t("account.error"), {
        description: t("account.authDisabled") || "Authentication service is not available. Please check your Firebase configuration."
      });
      return;
    }

    // 明示的なFirestoreの初期化とデバッグテスト
    console.log("Firestore check in handleSync:", { firestore });
    
    // Check if user is logged in
    if (!user) {
      toast.error(t("account.error"), {
        description: "You need to be logged in to sync sessions"
      });
      return;
    }
    
    setIsSyncing(true);
    try {
      await syncSessions();
      toast.success(t("account.syncedConversations"));
    } catch (error: unknown) {
      console.error("Sync error:", error);
      const errorMessage =
        error instanceof Error ? error.message : t("common.error.unknown");
      toast.error(t("account.error"), {
        description: errorMessage,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // 初期値の設定
    const privacyMode = window.localStorage.getItem("privacyMode");
    setPrivacyMode(privacyMode === "true");

    if (!auth && !isLoading) {
      toast.error(t("account.error"), {
        description: t("account.authDisabled"),
      });

      router.push("/home");
      return;
    }

    if (!user && !isLoading) {
      router.push("/");
    }

    if (user && !isLoading) {
      setIsLogged(true);
    }
  }, [user, isLoading, router, t]);

  function togglePrivacyMode() {
    const newValue = !privacyMode;
    window.localStorage.setItem("privacyMode", newValue ? "true" : "false");
    setPrivacyMode(newValue);
    // カスタムイベントをディスパッチ
    window.dispatchEvent(
      new CustomEvent("privacyModeChange", { detail: newValue })
    );
  }

  if (isLoading || isSessionsLoading) {
    return <Loading />;
  }

  return (
    isLogged && (
      <div className="space-y-6">
        <Card className="border border-border/30">
          <CardHeader>
            <CardTitle>{t("settings.account.profileSettings.title")}</CardTitle>
            <CardDescription>
              {t("settings.account.profileSettings.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/account" className="text-primary flex items-center">
              {t("settings.account.profileSettings.goToProfile")}
              <ArrowRight size={16} className="ml-2" />
            </Link>
          </CardContent>
        </Card>

        <div className="bg-card/50 border border-border/30 rounded-md overflow-hidden">
          <div className="flex p-5 items-center gap-4">
            <div className="flex-grow">
              <h3 className="text-lg font-bold">
                {t("settings.account.privacyMode.title")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("settings.account.privacyMode.description")}
              </p>
            </div>
            <div>
              <Switch
                className="scale-125"
                checked={privacyMode}
                onCheckedChange={togglePrivacyMode}
              />
            </div>
          </div>
        </div>

        <div className="bg-card/50 border border-border/30 rounded-md overflow-hidden">
          <div className="flex p-5 items-center gap-4">
            <div className="flex-grow">
              <h3 className="text-lg font-bold">
                {t("settings.account.sync.title")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("settings.account.sync.description")}
              </p>
            </div>
            <div>
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                variant="outline"
              >
                {isSyncing
                  ? t("settings.account.sync.syncing")
                  : t("settings.account.sync.action")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  );
}
