"use client";

import { useSettings } from "@/hooks/use-settings";
import { useTranslations } from "@/hooks/use-translations";
import { Switch } from "@workspace/ui/components/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Search, Users, ScrollText, GitBranch, Bot, Mic } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";

export default function CustomizeSettings() {
  const { settings, updateSetting } = useSettings();
  const t = useTranslations('settings.customize');

  return (
    <div className="space-y-6">
      <Card className="!gap-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {t('advancedSearch.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-grow">
              <p className="text-sm text-muted-foreground">
                {t('advancedSearch.description')}
              </p>
            </div>
            <Switch
              id="search"
              checked={settings.advancedSearch}
              onCheckedChange={(checked) => {
                updateSetting("advancedSearch", checked);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="!gap-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            {t('autoScroll.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-grow">
              <p className="text-sm text-muted-foreground">
                {t('autoScroll.description')}
              </p>
            </div>
            <Switch
              id="autoScroll"
              checked={settings.autoScroll}
              onCheckedChange={(checked) => {
                updateSetting("autoScroll", checked);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="!gap-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            {t('voiceMode.title')}
            <Badge>{t('soon')}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-grow">
              <p className="text-sm text-muted-foreground">{t('voiceMode.description')}</p>
            </div>
            <Switch
              id="voice"
              checked={settings.voice}
              onCheckedChange={(checked) => {
                updateSetting("voice", checked);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="!gap-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {t('bots.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-grow">
              <p className="text-sm text-muted-foreground">
                {t('bots.description')}
              </p>
            </div>
            <Switch
              id="bots"
              checked={settings.bots}
              onCheckedChange={(checked) => {
                updateSetting("bots", checked);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="!gap-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('hubs.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-grow">
              <p className="text-sm text-muted-foreground">
                {t('hubs.description')}
              </p>
            </div>
            <Switch
              id="hubs"
              checked={settings.hubs}
              onCheckedChange={(checked) => {
                updateSetting("hubs", checked);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="!gap-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            {t('branchConversations.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-grow">
              <p className="text-sm text-muted-foreground">
                {t('branchConversations.description')}
              </p>
            </div>
            <Switch
              id="branch"
              checked={settings.branch}
              onCheckedChange={(checked) => {
                updateSetting("branch", checked);
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
