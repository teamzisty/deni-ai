"use client";

import { Separator } from "@repo/ui/components/separator";
import { toast } from "sonner";
import { Button } from "@repo/ui/components/button";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/navigation";
import { Loading } from "@/components/loading";
import { updateProfile } from "firebase/auth";
import { Input } from "@repo/ui/components/input";
import { Switch } from "@repo/ui/components/switch";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { uploadResponse, useUploadThing } from "@/utils/uploadthing";
import logger from "@/utils/logger";
import React from "react";
import { useTranslations } from "next-intl";

export default function AccountSettingsPage() {
  const { user, isLoading } = useAuth();
  const { syncSessions } = useChatSessions();
  const [isLogged, setIsLogged] = useState(false);
  const [name, setName] = useState("");
  const [privacyMode, setPrivacyMode] = useState(false);
  const t = useTranslations();
  const [isSyncing, setIsSyncing] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [authToken, setAuthToken] = useState<string | null>(null);

  const { isUploading, startUpload } = useUploadThing("imageUploader", {
    headers: {
      Authorization: authToken || "",
    },
    onUploadError: (error: Error) => {
      toast.error(t("account.uploadFailed"), {
        description: `${t("account.error")}: ${error.message}`,
      });
    },
  });

  const handleSync = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      await syncSessions();
      toast.success(t("account.syncConversations"));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t("account.unknownError");
      toast.error(t("account.error"), {
        description: errorMessage,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const router = useRouter();

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
            message: t("account.fileNotSelected"),
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
                  message: t("account.unknownError"),
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
                  message: t("account.unknownError"),
                  code: "upload_failed",
                },
              });
            }
          } catch (error) {
            logger.error("uploadImage", `Something went wrong, ${error}`);
            resolve({
              status: "error",
              error: {
                message: t("account.unknownError"),
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
      toast.error(t("account.enterName"));
      return;
    }

    try {
      await updateProfile(user, {
        displayName: name,
      });

      toast.success(t("account.nameChanged"));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t("account.unknownError");
      toast.error(t("account.nameChangeFailed"), {
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
      loading: t("account.changingAvatar"),
      success: async (uploadResponse: uploadResponse) => {
        if (!uploadResponse.data) return;

        try {
          await updateProfile(user, {
            photoURL: uploadResponse.data.url,
          });

          return t("account.avatarChanged");
        } catch (error: unknown) {
          logger.error(
            "handleImagePaste",
            "Something went wrong, " + JSON.stringify(error)
          );
          return error instanceof Error
            ? error.message
            : t("account.unknownError");
        }
      },
      error: (uploadResponse: uploadResponse) => {
        logger.error(
          "handleImagePaste",
          "Something went wrong, " + JSON.stringify(uploadResponse.error)
        );
        return uploadResponse.error?.message || t("account.unknownError");
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
        <h2 className="text-2xl font-bold mb-1">{t("account.title")}</h2>
        <p className="text-sm text-muted-foreground mb-2">
          {t("account.description")}
        </p>

        {isLogged && (
          <div className="w-full bg-secondary shadow rounded-sm pb-0 mb-3">
            <div className="flex p-4 items-center gap-2">
              <div>
                <h3 className="text-lg font-bold">{t("account.changeName")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("account.changeNameDescription")}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Input
                  value={name}
                  placeholder={t("account.yourName")}
                  onChange={(e) => setName(e.target?.value)}
                />
                <Button onClick={handleChangeName}>{t("account.change")}</Button>
              </div>
            </div>
            <Separator className="mx-3 !w-[96%]" />
            <div className="flex p-4 items-center gap-2">
              <div>
                <h3 className="text-lg font-bold">{t("account.changeAvatar")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("account.changeAvatarDescription")}
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
                <Button disabled={isUploading} onClick={() => fileInputRef.current?.click()}>{t("account.change")}</Button>
              </div>
            </div>
            <Separator className="mx-3 !w-[96%]" />
            <div className="flex p-4 items-center gap-2">
              <div>
                <h3 className="text-lg font-bold">{t("account.privacyMode")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("account.privacyModeDescription")}
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
                <h3 className="text-lg font-bold">{t("account.syncConversations")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("account.syncConversationsDescription")}
                </p>
              </div>
              <div className="ml-auto">
                <Button onClick={handleSync} disabled={isSyncing}>
                  {isSyncing ? t("account.syncing") : t("account.sync")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
