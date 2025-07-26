"use client";

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
import { useSupabase } from "@/context/supabase-context";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@workspace/ui/components/badge";
import { Input } from "@workspace/ui/components/input";
import { useUploadThing } from "@/lib/uploadthing";
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
import { useRouter } from "@/i18n/navigation";
import { useSettings } from "@/hooks/use-settings";
import { Switch } from "@workspace/ui/components/switch";
import { Shield, Eye, Loader2, DownloadIcon, Lock } from "lucide-react";
import { useTranslations } from "next-intl";

export function AccountSettings() {
  const t = useTranslations();
  const { user, supabase, secureFetch } = useSupabase();
  const { settings, updateSetting } = useSettings();
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

  // Password change state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const { isUploading, startUpload } = useUploadThing("imageUploader", {
    headers: {
      Authorization: authToken || "",
    },
    onUploadError: (error: Error) => {
      toast.error(t("account.uploadFailed"), {
        description: `${t("common.actions.error")}: ${error.message}`,
      });
    },
  });

  const uploadImage = (file?: File) => {
    return new Promise<{
      status: string;
      data?: { url: string };
      error?: { message: string; code: string };
    }>((resolve) => {
      if (!file) {
        resolve({
          status: "error",
          error: {
            message: t("account.noFileSelected"),
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
            const data = (await startUpload([
              new File([file!], `${crypto.randomUUID()}.png`, {
                type: file!.type,
              }),
            ])) as any;

            if (!data) {
              resolve({
                status: "error",
                error: {
                  message: t("common.error.unknownError"),
                  code: "upload_failed",
                },
              });
              return;
            }

            if (data[0]?.url || data[0]?.ufsUrl) {
              resolve({
                status: "success",
                data: {
                  url: data[0].url || data[0].ufsUrl,
                },
              });
            } else {
              resolve({
                status: "error",
                error: {
                  message: t("common.error.unknownError"),
                  code: "upload_failed",
                },
              });
            }
          } catch (error) {
            console.error("uploadImage", `Something went wrong, ${error}`);
            resolve({
              status: "error",
              error: {
                message: t("common.error.unknownError"),
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
      toast.error(t("account.displayNameRequired"));
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: name,
        },
      });

      if (error) throw error;

      toast.success(t("account.displayNameUpdateSuccess"));
    } catch (error: any) {
      const errorMessage = t("account.displayNameUpdateFailed");
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
          toast.error(t("account.imageUploadFailed"));
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

      toast.success(t("account.profileUpdateSuccess"));
      setImagePreview(null);
      setSelectedImage(null);
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(t("account.profileUpdateFailed"), {
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
      // Fetch conversations from API
      const response = await secureFetch("/api/conversations");
      if (!response.ok) {
        throw new Error(t("account.fetchConversationsFailed"));
      }
      const conversations = await response.json();

      const userData = {
        user: {
          user_id: user?.id,
          email: user?.email,
          displayName: user?.user_metadata?.display_name,
          photoURL: user?.user_metadata?.avatar_url,
        },
        conversations: conversations,
      };

      const dataStr = JSON.stringify(userData, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

      const exportFileDefaultName = "deni-ai-data.json";

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();

      toast.success(t("account.dataDownloadSuccess"));
    } catch (error) {
      console.error("Failed to download data:", error);
      toast.error(t("account.dataDownloadFailed"));
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!supabase) return;

    // Reset error state
    setPasswordError(null);

    // Validate passwords
    if (!newPassword || !confirmPassword) {
      setPasswordError(t("account.passwordFieldsRequired"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t("account.passwordsDoNotMatch"));
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(t("account.passwordLengthError"));
      return;
    }

    try {
      setIsChangingPassword(true);

      // Update password using Supabase auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success(t("account.passwordChangeSuccess"));
      setShowPasswordDialog(false);
      // Reset form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      setPasswordError(error.message || t("account.passwordChangeFailed"));
    } finally {
      setIsChangingPassword(false);
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

      // Delete user account via API
      const response = await secureFetch("/api/user", {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("common.error.unexpectedError"));
      }

      router.push("/login");

      toast.success(t("account.accountDeleteSuccess"));
      // User will be automatically signed out
    } catch (error: any) {
      console.error("Failed to delete account:", error);
      toast.error(t("common.error.unexpectedError"), {
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
      <Card>
        <CardHeader>
          <CardTitle>{t("account.profileInformation")}</CardTitle>
          <CardDescription>
            {t("account.profileInformationDescription")}
          </CardDescription>
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
                  {t("account.displayName")}
                </div>
                <p className="font-medium">
                  {user.user_metadata?.display_name || t("account.notSet")}
                </p>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  {t("account.email")}
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{user.email}</p>
                  {user.email_confirmed_at && (
                    <Badge variant="outline">{t("account.confirmed")}</Badge>
                  )}
                </div>
              </div>

              <div>
                <Button onClick={handleOpenEditDialog}>
                  {t("account.editProfile")}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="!gap-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t("account.privacyMode")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-grow">
              <p className="text-sm text-muted-foreground">
                {t("account.privacyModeDescription")}
              </p>
            </div>
            <Switch
              className="scale-125"
              checked={settings.privacyMode}
              onCheckedChange={(checked) =>
                updateSetting("privacyMode", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className="!gap-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {t("account.conversationsPrivacyMode")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-grow">
              <p className="text-sm text-muted-foreground">
                {t("account.conversationsPrivacyModeDescription")}
              </p>
            </div>
            <Switch
              className="scale-125"
              checked={settings.conversationsPrivacyMode}
              onCheckedChange={(checked) =>
                updateSetting("conversationsPrivacyMode", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {t("account.changePassword")}
          </CardTitle>
          <CardDescription>
            {t("account.changePasswordDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowPasswordDialog(true)}>
            {t("account.changePassword")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("account.dataPrivacy")}</CardTitle>
          <CardDescription>
            {t("account.dataPrivacyDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleDownloadData} disabled={isDownloading}>
            {isDownloading ? <Loader2 /> : <DownloadIcon />}
            {isDownloading
              ? t("account.downloading")
              : t("account.downloadMyData")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("account.deleteAccount")}</CardTitle>
          <CardDescription>
            {t("account.deleteAccountDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={isDeleting || isAuthenticating}
          >
            {isDeleting ? t("account.deleting") : t("account.deleteAccount")}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("account.editProfile")}</DialogTitle>
            <DialogDescription>
              {t("account.editProfileDescription")}
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
                {t("account.changeAvatar")}
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
                {t("account.displayName")}
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("account.displayNamePlaceholder")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t("common.actions.cancel")}
            </Button>
            <Button onClick={handleProfileSave} disabled={isUploading || !name}>
              {t("account.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("account.changePassword")}</DialogTitle>
            <DialogDescription>
              {t("account.changePasswordDialogDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="new-password" className="text-sm font-medium">
                {t("account.newPassword")}
              </label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t("account.newPasswordPlaceholder")}
                disabled={isChangingPassword}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="confirm-password" className="text-sm font-medium">
                {t("account.confirmNewPassword")}
              </label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("account.confirmNewPasswordPlaceholder")}
                disabled={isChangingPassword}
              />
            </div>
            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(false);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setPasswordError(null);
              }}
              disabled={isChangingPassword}
            >
              {t("common.actions.cancel")}
            </Button>
            <Button
              onClick={handlePasswordChange}
              disabled={isChangingPassword || !newPassword || !confirmPassword}
            >
              {isChangingPassword
                ? t("account.changing")
                : t("account.changePassword")}
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
            <AlertDialogTitle>
              {t("account.confirmAccountDeletion")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("account.confirmAccountDeletionDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {isAuthenticating ? (
            <div className="flex flex-col items-center justify-center py-6">
              <Loading />
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <p>{t("account.deleteAccountConfirmation")}</p>
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
              {t("common.actions.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={proceedWithDeletion}
              disabled={isAuthenticating}
            >
              {t("account.deleteAccount")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default AccountSettings;
