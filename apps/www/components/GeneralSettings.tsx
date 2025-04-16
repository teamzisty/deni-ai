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
import { useEffect, useState } from "react";

export default function GeneralSettings() {
  const { setTheme, theme } = useTheme();
  const t = useTranslations();
  const params = useParams();
  const language = params.locale === "ja" ? "ja" : "en";
  const NextRouter = nextRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  const [advancedSearch, setAdvancedSearch] = useState(false);

  useEffect(() => {
    const AdvancedSearch = localStorage.getItem("advancedSearch");
    if (AdvancedSearch === "true") {
      setAdvancedSearch(true);
    } else {
      setAdvancedSearch(false);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    
    if (advancedSearch) {
      localStorage.setItem("advancedSearch", "true");
    } else {
      localStorage.removeItem("advancedSearch");
    }
  }, [advancedSearch]);

  return (
    <div className="space-y-6">
      <div className="bg-card/50 border border-border/30 rounded-md overflow-hidden">
        <div className="flex p-5 items-center gap-4">
          <div className="flex-grow">
            <h3 className="text-lg font-bold">
              {t("settings.general.search.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("settings.general.search.description")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="search"
              checked={advancedSearch}
              onCheckedChange={(checked) => {
                setAdvancedSearch(checked);
              }}
            />
          </div>
        </div>
      </div>

      <div className="bg-card/50 border border-border/30 rounded-md overflow-hidden">
        <div className="flex p-5 items-center gap-4">
          <div className="flex-grow">
            <h3 className="text-lg font-bold">
              {t("settings.general.theme.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("settings.general.theme.description")}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {t("settings.general.theme.action")}
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
                {t("settings.general.theme.system")}{" "}
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
              {t("settings.general.language.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("settings.general.language.description")}
            </p>
          </div>
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {t("settings.general.language.action")}
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
