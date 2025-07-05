"use client";

import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@workspace/ui/components/dropdown-menu";
import { Switch } from "@workspace/ui/components/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Check, Globe, Palette } from "lucide-react";
import { useTheme } from "next-themes";
import {
  useParams,
  useRouter as nextRouter,
  usePathname,
} from "next/navigation";
import UsageSettings from "./usage-settings";
import { useTranslations } from "@/hooks/use-translations";

export default function GeneralSettings() {
  const { setTheme, theme } = useTheme();
  const params = useParams();
  const language = params.locale === "ja" ? "ja" : "en";
  const NextRouter = nextRouter();
  const pathname = usePathname();
  const t = useTranslations("settings.general");

  return (
    <div className="space-y-6">
      <Card className="!gap-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {t("theme")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {t("themeDescription")}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="capitalize">
                  <Check />
                  {theme}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  {t("light")} {theme === "light" && <Check className="ml-auto" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  {t("dark")} {theme === "dark" && <Check className="ml-auto" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  {t("system")} {theme === "system" && <Check className="ml-auto" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <Card className="!gap-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t("language")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {t("languageDescription")}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Check />
                  {language}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    NextRouter.push(pathname.replace("/" + language, "/ja"));
                  }}
                >
                  {t("japanese")}{" "}
                  {language === "ja" && <Check className="ml-auto" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    NextRouter.push(pathname.replace("/" + language, "/en"));
                  }}
                >
                  {t("english")}{" "}
                  {language === "en" && <Check className="ml-auto" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics Section */}
      <UsageSettings />
    </div>
  );
}
