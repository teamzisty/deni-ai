"use client";

import { Separator } from "@repo/ui/components/separator";
import { Check } from "lucide-react";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { ChatSession, useChatSessions } from "@/hooks/use-chat-sessions";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@repo/ui/components/dropdown-menu";
import { useTheme } from "next-themes";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useRouter as nextRouter } from "next/navigation";
import { useParams } from "next/navigation";

export default function SettingsPage() {
  const { sessions, deleteSession, addSession } = useChatSessions();
  const { user, isLoading } = useAuth();
  const { setTheme, theme } = useTheme();
  const t = useTranslations();
  const params = useParams();
  const language = params.locale === "ja" ? "ja" : "en";
  const router = useRouter();
  const NextRouter = nextRouter();

  useEffect(() => {
    if (!user && !isLoading) {
      window.location.href = "/login";
    }
  }, [user, isLoading]);

  const exportAllConversion = () => {
    const conversionsArray: ChatSession[] = [];
    if (sessions) {
      sessions.forEach((session) => {
        conversionsArray.push(session);
      });
      if (conversionsArray.length > 0) {
        const blob = new Blob([JSON.stringify(conversionsArray)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `deni-ai-conversions-${new Date().toISOString()}.json`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        toast.error(t("settings.error"), {
          description: t("settings.noConversations"),
        });
      }
      toast.success(t("settings.exportSuccess"));
    } else {
      toast.error(t("settings.error"), {
        description: t("settings.noConversations"),
      });
    }
  };

  const importAllConversion = async () => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.click();

      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          sessions.forEach((session) => {
            deleteSession(session.id);
          });

          const jsonData = JSON.parse(
            event.target?.result as string
          ) as ChatSession[];
          jsonData.forEach((session: ChatSession) => {
            const newSession: ChatSession = {
              id: session.id,
              title: session.title,
              createdAt: session.createdAt,
              messages: session.messages,
            };
            addSession(newSession);
          });
          toast.success(t("settings.importSuccess"), {
            description: t("settings.importAllSuccess"),
          });
        };
        reader.readAsText(file);
      };
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      toast.error(t("settings.error"), {
        description: t("settings.fileReadError"),
      });
    }
  };

  const deleteAllConversion = () => {
    sessions.forEach((session) => {
      deleteSession(session.id);
    });
    toast.success(t("settings.deleteSuccess"), {
      description: t("settings.deleteAllSuccess"),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">
          {t("settings.conversation")}
        </label>
        <div className="w-full bg-secondary rounded-sm shadow mb-6">
          <div className="flex p-4 items-center gap-2">
            <div>
              <h3 className="text-lg font-bold">
                {t("settings.importExport")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("settings.importExportDescription")}
                <br />
                <span className="text-red-400">
                  {t("settings.importWarning")}
                </span>{" "}
              </p>
            </div>
            <div className="ml-auto flex gap-2 items-center">
              <Button onClick={importAllConversion}>
                {t("settings.import")}
              </Button>
              <Button onClick={exportAllConversion}>
                {t("settings.export")}
              </Button>
            </div>
          </div>
          <Separator className="!w-[96%] mx-auto" />
          <div className="flex p-4 items-center gap-2 mb-1">
            <div>
              <h3 className="text-lg font-bold">
                {t("settings.deleteAll")}{" "}
                <Badge className="text-foreground" variant={"destructive"}>
                  {t("settings.destructive")}
                </Badge>
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("settings.deleteAllDescription")}
              </p>
            </div>
            <div className="ml-auto">
              <Button onClick={deleteAllConversion} variant={"destructive"}>
                {t("settings.delete")}
              </Button>
            </div>
          </div>
        </div>

        <label className="block text-sm font-medium mb-2">
          {t("settings.settings")}
        </label>
        <div className="w-full bg-secondary rounded-sm shadow mb-6">
          <div className="flex p-4 items-center gap-2">
            <div>
              <h3 className="text-lg font-bold">{t("settings.appearance")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("settings.appearanceDescription")}
              </p>
            </div>
            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>{t("settings.changeTheme")}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    {t("settings.light")}{" "}
                    {theme === "light" && <Check className="ml-auto" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    {t("settings.dark")}{" "}
                    {theme === "dark" && <Check className="ml-auto" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    {t("settings.system")}{" "}
                    {theme === "system" && <Check className="ml-auto" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <Separator className="!w-[96%] mx-auto" />
          <div className="flex p-4 items-center gap-2 mb-1">
            <div>
              <h3 className="text-lg font-bold">{t("settings.language")} </h3>
              <p className="text-sm text-muted-foreground">
                {t("settings.languageDescription")}
              </p>
            </div>
            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>{t("settings.changeLanguage")}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      // 言語変更前にLocalStorageのデータを確保
                      const currentSessions = localStorage.getItem("chatSessions");
                      const currentSession = localStorage.getItem("currentChatSession");
                      
                      // 言語変更後に使用するためにセッションデータをsessionStorageに一時保存
                      if (currentSessions && currentSessions !== "[]") {
                        sessionStorage.setItem("temp_chatSessions", currentSessions);
                      }
                      if (currentSession && currentSession !== "null") {
                        sessionStorage.setItem("temp_currentSession", currentSession);
                      }
                      
                      // 言語変更ページへ移動
                      NextRouter.push("/ja/settings");
                    }}
                  >
                    {t("settings.japanese")}{" "}
                    {language === "ja" && <Check className="ml-auto" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      // 言語変更前にLocalStorageのデータを確保
                      const currentSessions = localStorage.getItem("chatSessions");
                      const currentSession = localStorage.getItem("currentChatSession");
                      
                      // 言語変更後に使用するためにセッションデータをsessionStorageに一時保存
                      if (currentSessions && currentSessions !== "[]") {
                        sessionStorage.setItem("temp_chatSessions", currentSessions);
                      }
                      if (currentSession && currentSession !== "null") {
                        sessionStorage.setItem("temp_currentSession", currentSession);
                      }
                      
                      // 言語変更ページへ移動
                      NextRouter.push("/en/settings");
                    }}
                  >
                    {t("settings.english")}{" "}
                    {language === "en" && <Check className="ml-auto" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>{" "}
        </div>
      </div>
    </div>
  );
}
