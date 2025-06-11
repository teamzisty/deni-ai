"use client";

import { useSettings } from "@/hooks/use-settings";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@workspace/ui/components/dropdown-menu";
import { Switch } from "@workspace/ui/components/switch";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useParams, usePathname } from "next/navigation";

export default function CustomizeSettings() {
  const t = useTranslations();
  const params = useParams();
  const { settings, updateSetting } = useSettings();

  return (
    <div className="space-y-6">
      <div className="bg-card/50 border border-border/30 rounded-md overflow-hidden">
        <div className="flex p-5 items-center gap-4">
          <div className="flex-grow">
            <h3 className="text-lg font-bold">
              {t("settings.customize.search.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("settings.customize.search.description")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="search"
              checked={settings.advancedSearch}
              onCheckedChange={(checked) => {
                updateSetting("advancedSearch", checked);
              }}
            />
          </div>
        </div>
      </div>

      <div className="bg-card/50 border border-border/30 rounded-md overflow-hidden">
        <div className="flex p-5 items-center gap-4">
          <div className="flex-grow">
            <h3 className="text-lg font-bold">
              {t("settings.customize.hubs.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("settings.customize.hubs.description")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="hubs"
              checked={settings.hubs}
              onCheckedChange={(checked) => {
                updateSetting("hubs", checked);
              }}
            />
          </div>
        </div>
      </div>

      <div className="bg-card/50 border border-border/30 rounded-md overflow-hidden">
        <div className="flex p-5 items-center gap-4">
          <div className="flex-grow">
            <h3 className="text-lg font-bold">
              {t("settings.customize.autoScroll.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("settings.customize.autoScroll.description")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="autoScroll"
              checked={settings.autoScroll}
              onCheckedChange={(checked) => {
                updateSetting("autoScroll", checked);
              }}
            />
          </div>
        </div>
      </div>

      <div className="bg-card/50 border border-border/30 rounded-md overflow-hidden">
        <div className="flex p-5 items-center gap-4">
          <div className="flex-grow">
            <h3 className="text-lg font-bold">
              {t("settings.customize.branch.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("settings.customize.branch.description")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="branch"
              checked={settings.branch}
              onCheckedChange={(checked) => {
                updateSetting("branch", checked);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
