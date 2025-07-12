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
  import { Search, Users, ScrollText, GitBranch, Bot, Mic, Monitor, Moon, Sun } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { useTheme } from "next-themes";

export default function CustomizeSettings() {
  const { settings, updateSetting } = useSettings();
  const t = useTranslations('settings.customize');
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  const colorThemes = [
    { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
    { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
    { value: 'green', label: 'Green', color: 'bg-green-500' },
    { value: 'orange', label: 'Orange', color: 'bg-orange-500' },
    { value: 'red', label: 'Red', color: 'bg-red-500' },
    { value: 'pink', label: 'Pink', color: 'bg-pink-500' },
    { value: 'indigo', label: 'Indigo', color: 'bg-indigo-500' },
    { value: 'yellow', label: 'Yellow', color: 'bg-yellow-500' },
  ];

  return (
    <div className="space-y-6">
      <Card className="!gap-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            {t('theme.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t('theme.description')}
            </p>
            <div className="flex flex-wrap gap-2">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.value}
                    variant={theme === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme(option.value)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="!gap-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            {t('colorTheme.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t('colorTheme.description')}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {colorThemes.map((colorTheme) => {
                const isSelected = settings.colorTheme === colorTheme.value;
                return (
                  <Button
                    key={colorTheme.value}
                    variant={isSelected ? "default" : "outline"}
                    className="h-auto p-3 justify-start"
                    onClick={() => {
                      updateSetting('colorTheme', colorTheme.value);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${colorTheme.color}`} />
                      <span className="text-sm">{colorTheme.label}</span>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

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
