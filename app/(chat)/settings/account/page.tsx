"use client";

import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTransitionRouter } from "next-view-transitions";
import { Loading } from "@/components/loading";
import { updateProfile } from "firebase/auth";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { uploadResponse, useUploadThing } from "@/utils/uploadthing";
import logger from "@/utils/logger";
import React from "react";

export default function AccountSettingsPage() {
  const { user, isLoading } = useAuth();
  const { syncSessions } = useChatSessions();
  const [isLogged, setIsLogged] = useState(false);
  const [name, setName] = useState("");
  const [privacyMode, setPrivacyMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [authToken, setAuthToken] = useState<string | null>(null);

  const { isUploading, startUpload } = useUploadThing("imageUploader", {
    headers: {
      Authorization: authToken || "",
    },
    onUploadError: (error: Error) => {
      toast.error("画像をアップロードできません", {
        description: `エラーが発生しました: ${error.message}`,
      });
    },
  });

  const handleSync = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      await syncSessions();
      toast.success("会話履歴を同期しました");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "不明なエラーが発生しました";
      toast.error("同期に失敗しました", {
        description: errorMessage,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const router = useTransitionRouter();

  useEffect(() => {
    // 初期値の設定
    const privacyMode = window.localStorage.getItem("privacyMode");
    setPrivacyMode(privacyMode === "true");

    if (!user && !isLoading) {
      router.push("/");
    }

    if (user && !isLoading) {
      setIsLogged(true);
      setName(privacyMode ? user.displayName || "" : "");
    }
  }, [user, isLoading, router]);

  const uploadImage = (file?: File) => {
    return new Promise<uploadResponse>((resolve) => {
      if (!file) {
        resolve({
          status: "error",
          error: {
            message: "ファイルが設定されていません",
            code: "file_not_selected",
          },
        });
        return;
      }

      user?.getIdToken().then((idToken) => {
        if (idToken) {
          setAuthToken(idToken);
        }

        setTimeout(async () => {
          try {
            const data = await startUpload([
              new File([file], `${crypto.randomUUID()}.png`, {
                type: file.type,
              }),
            ]);

            if (!data) {
              resolve({
                status: "error",
                error: {
                  message: "不明なエラーが発生しました",
                  code: "upload_failed",
                },
              });
              return;
            }

            if (data[0]?.ufsUrl) {
              resolve({
                status: "success",
                data: {
                  url: data[0].ufsUrl,
                },
              });
            } else {
              resolve({
                status: "error",
                error: {
                  message: "不明なエラーが発生しました",
                  code: "upload_failed",
                },
              });
            }
          } catch (error) {
            logger.error("uploadImage", `Something went wrong, ${error}`);
            resolve({
              status: "error",
              error: {
                message: "不明なエラーが発生しました",
                code: "upload_failed",
              },
            });
          }
        }, 1000);
      });
    });
  };

  const handleChangeName = async () => {
    if (!user) return;

    if (!name) {
      toast.error("名前を入力してください");
      return;
    }

    try {
      await updateProfile(user, {
        displayName: name,
      });

      toast.success("名前を変更しました");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "不明なエラーが発生しました";
      toast.error("名前の変更に失敗しました", {
        description: errorMessage,
      });
    }
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!user) return;

    const files = event.target?.files;
    if (!files) return;

    toast.promise<uploadResponse>(uploadImage(files[0]), {
      loading: "プロフィール画像を変更中...",
      success: async (uploadResponse: uploadResponse) => {
        if (!uploadResponse.data) return;

        try {
          await updateProfile(user, {
            photoURL: uploadResponse.data.url,
          });

          return "プロフィール画像を変更しました";
        } catch (error: unknown) {
          logger.error(
            "handleImagePaste",
            "Something went wrong, " + JSON.stringify(error)
          );
          return error instanceof Error
            ? error.message
            : "不明なエラーが発生しました";
        }
      },
      error: (uploadResponse: uploadResponse) => {
        logger.error(
          "handleImagePaste",
          "Something went wrong, " + JSON.stringify(uploadResponse.error)
        );
        return uploadResponse.error?.message || "不明なエラーが発生しました";
      },
    });
  };

  function togglePrivacyMode() {
    const newValue = !privacyMode;
    window.localStorage.setItem("privacyMode", newValue ? "true" : "false");
    setPrivacyMode(newValue);
    // カスタムイベントをディスパッチ
    window.dispatchEvent(
      new CustomEvent("privacyModeChange", { detail: newValue })
    );
  }

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">アカウントの管理</h2>
        <p className="text-sm text-muted-foreground mb-2">
          あなたのアカウントを管理します。
        </p>

        {isLogged && (
          <div className="w-full bg-secondary shadow rounded-sm pb-0 mb-3">
            <div className="flex p-4 items-center gap-2">
              <div>
                <h3 className="text-lg font-bold">名前を変更</h3>
                <p className="text-sm text-muted-foreground">
                  あなたの名前を変更します。
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Input
                  value={name}
                  placeholder="あなたの名前"
                  onChange={(e) => setName(e.target?.value)}
                />
                <Button onClick={handleChangeName}>変更</Button>
              </div>
            </div>
            <Separator className="mx-3 !w-[96%]" />
            <div className="flex p-4 items-center gap-2">
              <div>
                <h3 className="text-lg font-bold">プロフィール画像を変更</h3>
                <p className="text-sm text-muted-foreground">
                  あなたのアバターを変更します。
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <Button disabled={isUploading} onClick={() => fileInputRef.current?.click()}>変更</Button>
              </div>
            </div>
            <Separator className="mx-3 !w-[96%]" />
            <div className="flex p-4 items-center gap-2">
              <div>
                <h3 className="text-lg font-bold">プライバシーモード</h3>
                <p className="text-sm text-muted-foreground">
                  あなたの名前、メールアドレス、プロフィール画像を非表示にします。
                </p>
              </div>
              <div className="ml-auto">
                <Switch
                  checked={privacyMode}
                  onCheckedChange={togglePrivacyMode}
                />
              </div>
            </div>
            <Separator className="mx-3 !w-[96%]" />
            <div className="flex p-4 items-center gap-2">
              <div>
                <h3 className="text-lg font-bold">会話履歴の同期</h3>
                <p className="text-sm text-muted-foreground">
                  会話履歴をクラウドと同期します。
                </p>
              </div>
              <div className="ml-auto">
                <Button onClick={handleSync} disabled={isSyncing}>
                  {isSyncing ? "同期中..." : "同期する"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
