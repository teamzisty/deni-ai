import { Button } from "@/components/ui/button";
import {
  Earth,
  FolderSync,
  LogOut,
  Notebook,
  Settings,
  User2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { memo, useEffect, useState } from "react";
import { User } from "firebase/auth";
import { Link } from "next-view-transitions";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { toast } from "sonner";

interface AccountDropdownMenuProps {
  user: User | null;
  handleAuth: () => void;
}

export const AccountDropdownMenu = memo(
  ({ user, handleAuth }: AccountDropdownMenuProps) => {
    const [privacyMode, setPrivacyMode] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const { syncSessions } = useChatSessions();

    useEffect(() => {
      // 初期値の設定
      const privacyMode = window.localStorage.getItem("privacyMode");
      setPrivacyMode(privacyMode === "true");

      // 他のタブ/ウィンドウからの変更を監視
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "privacyMode") {
          setPrivacyMode(e.newValue === "true");
        }
      };

      // 同じウィンドウ内での変更を監視
      const handlePrivacyModeChange = (e: CustomEvent<boolean>) => {
        setPrivacyMode(e.detail);
      };

      window.addEventListener("storage", handleStorageChange);
      window.addEventListener(
        "privacyModeChange",
        handlePrivacyModeChange as EventListener
      );

      return () => {
        window.removeEventListener("storage", handleStorageChange);
        window.removeEventListener(
          "privacyModeChange",
          handlePrivacyModeChange as EventListener
        );
      };
    }, []);

    const handleSync = async () => {
      if (!user) return;
      setIsSyncing(true);
      try {
        await syncSessions();
        toast.success("会話履歴を同期しました");
      } catch (error: unknown) {
        if (error instanceof Error) {
          toast.error("同期に失敗しました", {
            description: error.message,
          });
        } else {
          toast.error("同期に失敗しました");
        }
      } finally {
        setIsSyncing(false);
      }
    };

    if (!user) {
      return (
        <Button variant="outline" className="rounded-full">
          <User2 size="16" />
          ログイン
        </Button>
      );
    }
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-16 p-2 ml-1 justify-start">
            {user.photoURL ? (
              <Image
                src={user.photoURL}
                alt={user.displayName || "User Avatar"}
                width={40}
                height={40}
                className={`rounded-full ${privacyMode && "blur-sm"}`}
                priority
              />
            ) : (
              <User2 size="16" />
            )}
            <div className="flex flex-col text-left">
              <span className={privacyMode ? "blur-sm" : ""}>
                {user.displayName}
              </span>
              <span
                className={`text-muted-foreground ${
                  privacyMode ? "blur-sm" : ""
                }`}
              >
                {user.email}
              </span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
          align="start"
        >
          <DropdownMenuLabel>
            <div className="h-16 justify-start flex items-center gap-2 md:max-w-[210px]">
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={user.displayName || "User Avatar"}
                  width={40}
                  height={40}
                  className={`rounded-full ${privacyMode && "blur-sm"}`}
                  priority
                />
              ) : (
                <User2 size="16" />
              )}
              <div className="flex flex-col text-left">
                <span className={`${privacyMode && "blur-sm"}`}>
                  {user.displayName}
                </span>
                <span
                  className={`text-muted-foreground ${
                    privacyMode && "blur-sm"
                  }`}
                >
                  {user.email}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href="/settings/account" className="w-full">
              <User2 />
              アカウント
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="w-full">
              <Settings />
              ユーザー設定
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSync} disabled={isSyncing}>
            <FolderSync />
            <span>{isSyncing ? "同期しています..." : "会話履歴を同期"}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="https://voids.top" target="_blank" className="w-full">
              <Earth />
              voids.top
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link
              href="https://voids.top/docs"
              target="_blank"
              className="w-full"
            >
              <Notebook />
              Voids API Docs
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleAuth}>
            <LogOut /> ログアウト
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
);

AccountDropdownMenu.displayName = "AccountDropdownMenu";
