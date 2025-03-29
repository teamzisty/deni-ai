"use client";

import { Separator } from "@/components/ui/separator";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatSession, useChatSessions } from "@/hooks/use-chat-sessions";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useEffect } from "react";

export default function SettingsPage() {
  const { sessions, deleteSession, addSession } = useChatSessions();
  const { user, isLoading } = useAuth();
  const { setTheme, theme } = useTheme();

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
        toast.error("エラーが発生しました", {
          description: "会話が1つも存在しないため、エクスポートできません。",
        });
      }
      toast.success("会話をエクスポートしました");
    } else {
      toast.error("エラーが発生しました", {
        description: "会話が1つも存在しないため、エクスポートできません。",
      });
    }
  };

  const importAllConversion = async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
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
          toast.success("会話をインポートしました", {
            description: "ファイルにあるすべての会話をインポートしました",
          });
        };
        reader.readAsText(file);
      };
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      toast.error("エラーが発生しました", {
        description: "ファイルの読み込み中にエラーが発生しました",
      });
    }
  };

  const deleteAllConversion = () => {
    sessions.forEach((session) => {
      deleteSession(session.id);
    });
    toast.success("会話を削除しました", {
      description: "すべての会話を削除しました",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">会話</label>
        <div className="w-full bg-secondary rounded-sm shadow mb-6">
          <div className="flex p-4 items-center gap-2">
            <div>
              <h3 className="text-lg font-bold">
                会話のインポート / エクスポート
              </h3>
              <p className="text-sm text-muted-foreground">
                会話をインポートしたり、エクスポートします。
                <br />
                <span className="text-red-400">
                  ※注意:
                  インポートすると、すべての会話が削除され、上書きされます。
                </span>{" "}
              </p>
            </div>
            <div className="ml-auto flex gap-2 items-center">
              <Button onClick={importAllConversion}>インポート</Button>
              <Button onClick={exportAllConversion}>エクスポート</Button>
            </div>
          </div>
          <Separator className="!w-[96%] mx-auto" />
          <div className="flex p-4 items-center gap-2 mb-1">
            <div>
              <h3 className="text-lg font-bold">
                すべての会話を削除{" "}
                <Badge className="text-foreground" variant={"destructive"}>破壊的</Badge>
              </h3>
              <p className="text-sm text-muted-foreground">
                すべての会話を削除します。このアクションは取り戻すことはできません。
              </p>
            </div>
            <div className="ml-auto">
              <Button onClick={deleteAllConversion} variant={"destructive"}>
                削除
              </Button>
            </div>
          </div>
        </div>

        <label className="block text-sm font-medium mb-2">設定</label>
        <div className="w-full bg-secondary shadow rounded-sm pb-0 mb-3">
          <div className="flex p-4 items-center gap-2">
            <div>
              <h3 className="text-lg font-bold">外観テーマ</h3>
              <p className="text-sm text-muted-foreground">
                ライトテーマかダークテーマに変更します。
              </p>
            </div>
            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>テーマを変更</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    ライト{" "}
                    {theme === "light" && <Check className="ml-auto" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    ダーク{" "}
                    {theme === "dark" && <Check className="ml-auto" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    システム{" "}
                    {theme === "system" && <Check className="ml-auto" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}