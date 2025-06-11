"use client";

import { useTranslations } from "next-intl";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@workspace/ui/components/badge";
import { Input } from "@workspace/ui/components/input";
import logger from "@/utils/logger";
import { uploadResponse, useUploadThing } from "@/utils/uploadthing";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Loading } from "@/components/loading";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { SecureFetch } from "@/lib/secureFetch";
import { useRouter } from "@/i18n/navigation";

export function AccountSettings() {
  const t = useTranslations("account");
  const ct = useTranslations("common");
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [name, setName] = useState(user?.user_metadata?.display_name || "");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const router = useRouter();

  // Re-authentication state for deletion
  const [showDeleteReauthDialog, setShowDeleteReauthDialog] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [reauthPassword, setReauthPassword] = useState("");
  const [reauthError, setReauthError] = useState<string | null>(null);

  const { exportAllSessions } = useChatSessions();

  const { isUploading, startUpload } = useUploadThing("imageUploader", {
    headers: {
      Authorization: authToken || "",
    },
    onUploadError: (error: Error) => {
      toast.error(t("uploadFailed"), {
        description: `${t("error")}: ${error.message}`,
      });
    },
  });

  const supabase = createClient();

  const uploadImage = (file?: File) => {
    return new Promise<uploadResponse>((resolve) => {
      if (!file) {
        resolve({
          status: "error",
          error: {
            message: t("fileNotSelected"),
            code: "file_not_selected",
          },
        });
        return;
      }
      async function upload() {
        if (user && supabase) {
          // Get Supabase session token instead of user.id
          const {
            data: { session },
          } = await supabase!.auth.getSession();
          if (session?.access_token) {
            setAuthToken(`Bearer ${session.access_token}`);
          }
        }
        setTimeout(async () => {
          try {
            const data = await startUpload([
              new File([file!], `${crypto.randomUUID()}.png`, {
                type: file!.type,
              }),
            ]);

            if (!data) {
              resolve({
                status: "error",
                error: {
                  message: "Unknown error",
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
                  message: "Unknown error",
                  code: "upload_failed",
                },
              });
            }
          } catch (error) {
            logger.error("uploadImage", `Something went wrong, ${error}`);
            resolve({
              status: "error",
              error: {
                message: "Unknown error",
                code: "upload_failed",
              },
            });
          }
        }, 1000);
      }

      upload();
    });
  };

  const handleChangeName = async () => {
    if (!user || !supabase) return;

    if (!name) {
      toast.error(t("nameRequired"));
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: name,
        },
      });

      if (error) throw error;

      toast.success(t("nameUpdateSuccess"));
    } catch (error: any) {
      const errorMessage = t("nameUpdateFailed");
      toast.error(errorMessage, {
        description: error.message,
      });
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create preview URL
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleProfileSave = async () => {
    if (!user || !supabase) return;

    try {
      let photoURL = user.user_metadata?.avatar_url;

      // Upload image if selected
      if (selectedImage) {
        const response = await uploadImage(selectedImage);
        if (response.status === "success" && response.data) {
          photoURL = response.data.url;
        } else {
          toast.error(t("uploadFailed"));
          return;
        }
      }

      // Update user profile
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: name,
          avatar_url: photoURL,
        },
      });

      if (error) throw error;

      toast.success(t("profileUpdateSuccess"));
      setImagePreview(null);
      setSelectedImage(null);
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(t("profileUpdateFailed"), {
        description: error.message,
      });
    }
  };

  const handleOpenEditDialog = () => {
    setName(user?.user_metadata?.display_name || "");
    setSelectedImage(null);
    setImagePreview(null);
    setIsDialogOpen(true);
  };

  const handleDownloadData = async () => {
    setIsDownloading(true);
    try {
      const sessions = await exportAllSessions();
      const userData = {
        user: {
          user_id: user?.id,
          email: user?.email,
          displayName: user?.user_metadata?.display_name,
          photoURL: user?.user_metadata?.avatar_url,
        },
        sessions: sessions,
      };

      const dataStr = JSON.stringify(userData, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

      const exportFileDefaultName = "deni-ai-data.json";

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();

      toast.success(t("downloadSuccess"));
    } catch (error) {
      console.error("Failed to download data:", error);
      toast.error(t("downloadFailed"));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setShowDeleteReauthDialog(true);
  };

  const proceedWithDeletion = async () => {
    if (!user || !supabase) return;

    try {
      setIsDeleting(true);
      setShowDeleteReauthDialog(false);

      // In Supabase, we can delete the user through admin API or RPC function
      // For now, we'll use the auth.admin.deleteUser method if available
      const secureFetch = new SecureFetch(user);
      const response = await secureFetch.fetch("/api/account", {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || ct("error.occurred"));
      }

      router.push("/login");

      toast.success(t("delete.success"));
      // User will be automatically signed out
    } catch (error: any) {
      console.error("Failed to delete account:", error);
      toast.error(ct("error.occurred"), {
        description: error.message,
      });
      setIsDeleting(false);
    }
  };

  if (!user) {
    return null;
  }

  // Get the first letter of the display name for the avatar fallback
  const nameInitial =
    user.user_metadata?.display_name?.[0] || user.email?.[0] || "?";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <Card className="bg-secondary/80">
        <CardHeader>
          <CardTitle>{t("profile.title")}</CardTitle>
          <CardDescription>{t("profile.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex gap-4 items-center">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.user_metadata?.avatar_url || ""} />
                <AvatarFallback className="text-2xl">
                  {nameInitial}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  {t("profile.displayName")}
                </div>
                <p className="font-medium">
                  {user.user_metadata?.display_name || t("profile.noName")}
                </p>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  {t("profile.email")}
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{user.email}</p>
                  {user.email_confirmed_at && (
                    <Badge variant="outline">{t("profile.confirmed")}</Badge>
                  )}
                </div>
              </div>

              <div>
                <Button onClick={handleOpenEditDialog}>
                  {t("profile.edit")}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-secondary/80">
        <CardHeader>
          <CardTitle>{t("data.title")}</CardTitle>
          <CardDescription>{t("data.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleDownloadData} disabled={isDownloading}>
            {isDownloading ? t("data.downloading") : t("data.download")}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-secondary/80">
        <CardHeader>
          <CardTitle>{t("delete.title")}</CardTitle>
          <CardDescription>{t("delete.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={isDeleting || isAuthenticating}
          >
            {isDeleting ? t("delete.deleting") : t("delete.button")}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("profile.edit")}</DialogTitle>
            <DialogDescription>
              {t("profile.editDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center gap-4">
              <Avatar
                className="h-24 w-24 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <AvatarImage
                  src={imagePreview || user.user_metadata?.avatar_url || ""}
                />
                <AvatarFallback className="text-3xl">
                  {nameInitial}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                {t("profile.changeAvatar")}
              </Button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                {t("profile.displayName")}
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("profile.namePlaceholder")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t("profile.cancel")}
            </Button>
            <Button onClick={handleProfileSave} disabled={isUploading || !name}>
              {t("profile.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Re-authentication Dialog */}
      <AlertDialog
        open={showDeleteReauthDialog}
        onOpenChange={setShowDeleteReauthDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete.reauth.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete.reauth.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {isAuthenticating ? (
            <div className="flex flex-col items-center justify-center py-6">
              <Loading />
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <p>{t("delete.reauth.confirmMessage")}</p>
              {reauthError && (
                <p className="text-sm text-destructive">{reauthError}</p>
              )}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowDeleteReauthDialog(false);
                setReauthPassword("");
                setReauthError(null);
              }}
              disabled={isAuthenticating}
            >
              {t("profile.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={proceedWithDeletion}
              disabled={isAuthenticating}
            >
              {t("delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
