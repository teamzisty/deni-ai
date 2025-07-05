"use client";

import { useSettings } from "@/hooks/use-settings";
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

  return (
    <div className="space-y-6">
      <Card className="!gap-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-grow">
              <p className="text-sm text-muted-foreground">
                We use a more detailed model internally for searching
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
            Auto Scroll
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-grow">
              <p className="text-sm text-muted-foreground">
                Automatically scroll to new messages
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
            Voice Mode
            <Badge>Soon</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-grow">
              <p className="text-sm text-muted-foreground">Talk to Deni AI about anything</p>
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
            Bots
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-grow">
              <p className="text-sm text-muted-foreground">
                AI collections created by the community
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
            Hubs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-grow">
              <p className="text-sm text-muted-foreground">
                Organize conversations into folders
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
            Branch Conversations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-grow">
              <p className="text-sm text-muted-foreground">
                Enable conversation branching feature
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
