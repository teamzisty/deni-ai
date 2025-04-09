"use client";

import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@repo/ui/components/dropdown-menu";
import { Switch } from "@repo/ui/components/switch";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import {
  useParams,
  useRouter as nextRouter,
  usePathname,
} from "next/navigation";
import { useState, useEffect } from "react";

export default function AppearanceSettings() {
  // const { sessions, deleteSession, addSession } = useChatSessions();
  const { setTheme, theme } = useTheme();
  const [defaultTheme, setDefaultTheme] = useState(false);
  const t = useTranslations();
  const params = useParams();
  const language = params.locale === "ja" ? "ja" : "en";
  const NextRouter = nextRouter();
  const pathname = usePathname();

  useEffect(() => {
    const defaultTheme = localStorage.getItem("defaultTheme");
    if (defaultTheme === "true") {
      setDefaultTheme(true);
    } else {
      setDefaultTheme(false);
    }
  }, []);

  useEffect(() => {
    if (defaultTheme) {
      localStorage.setItem("defaultTheme", "true");
      document.documentElement.setAttribute("data-default-theme", "true");
    } else {
      localStorage.setItem("defaultTheme", "false");
      document.documentElement.setAttribute("data-default-theme", "false");
    }
  }, [defaultTheme]);

  // const exportAllConversion = () => {
  //   const conversionsArray: ChatSession[] = [];
  //   if (sessions) {
  //     sessions.forEach((session) => {
  //       conversionsArray.push(session);
  //     });
  //     if (conversionsArray.length > 0) {
  //       const blob = new Blob([JSON.stringify(conversionsArray)], {
  //         type: "application/json",
  //       });
  //       const url = URL.createObjectURL(blob);
  //       const link = document.createElement("a");
  //       link.href = url;
  //       link.download = `deni-ai-conversions-${new Date().toISOString()}.json`;
  //       link.click();
  //       URL.revokeObjectURL(url);
  //     } else {
  //       toast.error(t("settings.error"), {
  //         description: t("settings.noConversations"),
  //       });
  //     }
  //     toast.success(t("settings.exportSuccess"));
  //   } else {
  //     toast.error(t("settings.error"), {
  //       description: t("settings.noConversations"),
  //     });
  //   }
  // };

  // const importAllConversion = async () => {
  //   try {
  //     const input = document.createElement("input");
  //     input.type = "file";
  //     input.accept = ".json";
  //     input.click();

  //     input.onchange = (e) => {
  //       const file = (e.target as HTMLInputElement).files?.[0];
  //       if (!file) return;
  //       const reader = new FileReader();
  //       reader.onload = (event) => {
  //         sessions.forEach((session) => {
  //           deleteSession(session.id);
  //         });

  //         const jsonData = JSON.parse(
  //           event.target?.result as string
  //         ) as ChatSession[];
  //         jsonData.forEach((session: ChatSession) => {
  //           const newSession: ChatSession = {
  //             id: session.id,
  //             title: session.title,
  //             createdAt: session.createdAt,
  //             messages: session.messages,
  //           };
  //           addSession(newSession);
  //         });
  //         toast.success(t("settings.importSuccess"), {
  //           description: t("settings.importAllSuccess"),
  //         });
  //       };
  //       reader.readAsText(file);
  //     };
  //   } catch (error: unknown) {
  //     if (error instanceof Error && error.name === "AbortError") {
  //       return;
  //     }
  //     toast.error(t("settings.error"), {
  //       description: t("settings.fileReadError"),
  //     });
  //   }
  // };

  // const deleteAllConversion = () => {
  //   sessions.forEach((session) => {
  //     deleteSession(session.id);
  //   });
  //   toast.success(t("settings.deleteSuccess"), {
  //     description: t("settings.deleteAllSuccess"),
  //   });
  // };

  // if (isLoading) {
  //   return <Loading />;
  // }

  return (
    <div className="space-y-6">
      <div className="bg-card/50 border border-border/30 rounded-md overflow-hidden">
        <div className="flex p-5 items-center gap-4">
          <div className="flex-grow">
            <h3 className="text-lg font-bold">
              {t("settings.appearance.theme.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("settings.appearance.theme.description")}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {t("settings.appearance.theme.action")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                {t("common.themes.light")}{" "}
                {theme === "light" && <Check className="ml-auto" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                {t("common.themes.dark")}{" "}
                {theme === "dark" && <Check className="ml-auto" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                {t("settings.appearance.theme.system")}{" "}
                {theme === "system" && <Check className="ml-auto" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="bg-card/50 border border-border/30 rounded-md overflow-hidden">
        <div className="flex p-5 items-center gap-4">
          <div className="flex-grow">
            <h3 className="text-lg font-bold">
              {t("settings.appearance.defaultTheme.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("settings.appearance.defaultTheme.description")}
            </p>
          </div>
          <div>
            <Switch
              className="scale-125"
              name="defaultTheme"
              checked={defaultTheme}
              onCheckedChange={setDefaultTheme}
            />
          </div>
        </div>
      </div>

      <div className="bg-card/50 border border-border/30 rounded-md overflow-hidden">
        <div className="flex p-5 items-center gap-4">
          <div className="flex-grow">
            <h3 className="text-lg font-bold">
              {t("settings.appearance.language.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("settings.appearance.language.description")}
            </p>
          </div>
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {t("settings.appearance.language.action")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    // 言語変更前にLocalStorageのデータを確保
                    const currentSessions =
                      localStorage.getItem("chatSessions");
                    const currentSession =
                      localStorage.getItem("currentChatSession");

                    // 言語変更後に使用するためにセッションデータをsessionStorageに一時保存
                    if (currentSessions && currentSessions !== "[]") {
                      sessionStorage.setItem(
                        "temp_chatSessions",
                        currentSessions
                      );
                    }
                    if (currentSession && currentSession !== "null") {
                      sessionStorage.setItem(
                        "temp_currentSession",
                        currentSession
                      );
                    }

                    // 言語変更ページへ移動
                    NextRouter.push(pathname.replace("/" + language, "/ja"));
                  }}
                >
                  {"Japanese - 日本語"}{" "}
                  {language === "ja" && <Check className="ml-auto" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    // 言語変更前にLocalStorageのデータを確保
                    const currentSessions =
                      localStorage.getItem("chatSessions");
                    const currentSession =
                      localStorage.getItem("currentChatSession");

                    // 言語変更後に使用するためにセッションデータをsessionStorageに一時保存
                    if (currentSessions && currentSessions !== "[]") {
                      sessionStorage.setItem(
                        "temp_chatSessions",
                        currentSessions
                      );
                    }
                    if (currentSession && currentSession !== "null") {
                      sessionStorage.setItem(
                        "temp_currentSession",
                        currentSession
                      );
                    }

                    // 言語変更ページへ移動
                    NextRouter.push(pathname.replace("/" + language, "/en"));
                  }}
                >
                  {"English - 英語"}{" "}
                  {language === "en" && <Check className="ml-auto" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
