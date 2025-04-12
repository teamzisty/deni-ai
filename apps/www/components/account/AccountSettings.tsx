"use client";

import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import { useAuth } from "@/context/AuthContext";
import { deleteUser, getAuth, updateProfile, EmailAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup, GoogleAuthProvider, GithubAuthProvider, getMultiFactorResolver, TotpMultiFactorGenerator } from "firebase/auth";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@repo/ui/components/badge";
import { Input } from "@repo/ui/components/input";
import logger from "@/utils/logger";
import { uploadResponse, useUploadThing } from "@/utils/uploadthing";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/alert-dialog";
import { Label } from "@repo/ui/components/label";
import { Loading } from "@/components/loading";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@repo/ui/components/input-otp";
import { useChatSessions } from "@/hooks/use-chat-sessions";

export function AccountSettings() {
  const t = useTranslations("account");
  const { user, auth } = useAuth(); // Add auth from context
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [name, setName] = useState(user?.displayName || "");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Re-authentication state for deletion
  const [showDeleteReauthDialog, setShowDeleteReauthDialog] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [reauthPassword, setReauthPassword] = useState("");
  const [reauthError, setReauthError] = useState<string | null>(null);
  const [showVerify2FADialog, setShowVerify2FADialog] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [dialogPromiseRef, setDialogPromiseRef] = useState<{ resolve: (value: string) => void } | null>(null);

  const { exportAllSessions } = useChatSessions(); // Assuming this is a function to export all sessions

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
      });
    });
  };

  const handleChangeName = async () => {
    if (!user) return;

    if (!name) {
      toast.error(t("nameRequired"));
      return;
    }

    try {
      await updateProfile(user, {
        displayName: name,
      });
      toast.success(t("nameChangeSuccess"));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(t("nameChangeFailed"), {
        description: errorMessage,
      });
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target?.files;
    if (!files || !files[0]) return;

    const file = files[0];
    setSelectedImage(file);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const handleProfileSave = async () => {
    if (!user) return;

    
    // Upload image if selected
    if (selectedImage) {
      const response = await uploadImage(selectedImage);
      if (response.status === "success" && response.data) {
        try {
          await updateProfile(user, {
            photoURL: response.data.url,
          });
        } catch (error) {
          logger.error("handleProfileSave", "Failed to update photo: " + JSON.stringify(error));
          toast.error(t("avatarChangeFailed"));
          return;
        }
      } else {
        toast.error(response.error?.message || "Unknown error");
        return;
      }
    }
    
    // Update name
    if (name !== user.displayName) {
      try {
        await updateProfile(user, {
          displayName: name,
        });
      } catch (error) {
        logger.error("handleProfileSave", "Failed to update name: " + JSON.stringify(error));
        toast.error(t("nameChangeFailed"));
        return;
      }
    }
    
    // Clean up and close dialog
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setSelectedImage(null);
    setImagePreview(null);
    setIsDialogOpen(false);
    
    toast.success(t("profileUpdateSuccess"));
  };
  
  const handleOpenEditDialog = () => {
    setName(user?.displayName || "");
    setSelectedImage(null);
    setImagePreview(null);
    setIsDialogOpen(true);
  };

  const handleDownloadData = async () => {
    try {
      setIsDownloading(true);
      // TODO: Implement data download logic
      const sessions = await exportAllSessions()
      const parsedSessions = JSON.parse(sessions);
      const userData = {
        profile: {
          name: user?.displayName,
          email: user?.email,
          photoURL: user?.photoURL,
        },
        parsedSessions
      };
      const blob = new Blob([JSON.stringify(userData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "account-data.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t("data.downloadSuccess"));
    } catch (error) {
      console.error("Failed to download data:", error);
      toast.error(t("data.downloadError"));
    } finally {
      setIsDownloading(false);
    }
  };

  // --- Re-authentication Logic (adapted from SecurityPage) ---

  const request2FaCode = () => {
    setTotpCode("");
    setReauthError(null);
    setShowVerify2FADialog(true);

    return new Promise<string>((resolve) => {
      setDialogPromiseRef({ resolve });
    });
  };

  const close2FADialog = () => {
    setShowVerify2FADialog(false);
    if (dialogPromiseRef) {
      dialogPromiseRef.resolve(totpCode);
      setDialogPromiseRef(null);
    }
  };

  const handle2FAReauth = async (error: any) => {
    if (!user || !auth) return false;

    try {
      const resolver = getMultiFactorResolver(auth, error);
      const factor = resolver.hints[0];

      if (factor && factor.factorId === TotpMultiFactorGenerator.FACTOR_ID) {
        const tfaCode = await request2FaCode();
        if (!tfaCode) return false; // User cancelled 2FA dialog

        const multiFactorAssertion =
          TotpMultiFactorGenerator.assertionForSignIn(factor.uid, tfaCode);

        await resolver.resolveSignIn(multiFactorAssertion);
        return true;
      }

      setReauthError(t("security.errorVerifying")); // Use translation from security section
      return false;
    } catch (error: any) {
      logger.error("handle2FAReauth", `2FA reauth error: ${error}`);
      setReauthError(error.message);
      return false;
    }
  };

  const reauthenticateWithGoogle = async () => {
    if (!user) return false;
    try {
      setIsAuthenticating(true);
      const provider = new GoogleAuthProvider();
      await reauthenticateWithPopup(user, provider);
      return true;
    } catch (error: any) {
      logger.error("reauthenticateWithGoogle", `Google reauth error: ${error}`);
      if (error.code === "auth/multi-factor-auth-required") {
        return await handle2FAReauth(error);
      }
      setReauthError(error.message);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const reauthenticateWithGitHub = async () => {
    if (!user) return false;
    try {
      setIsAuthenticating(true);
      const provider = new GithubAuthProvider();
      await reauthenticateWithPopup(user, provider);
      return true;
    } catch (error: any) {
      logger.error("reauthenticateWithGitHub", `GitHub reauth error: ${error}`);
      if (error.code === "auth/multi-factor-auth-required") {
        return await handle2FAReauth(error);
      }
      setReauthError(error.message);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const reauthenticateWithPassword = async () => {
    if (!user || !user.email) return false;
    try {
      setIsAuthenticating(true);
      const credential = EmailAuthProvider.credential(user.email, reauthPassword);
      await reauthenticateWithCredential(user, credential);
      return true;
    } catch (error: any) {
      logger.error("reauthenticateWithPassword", `Password reauth error: ${error}`);
      if (error.code === "auth/multi-factor-auth-required") {
        return await handle2FAReauth(error);
      } else if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password"
      ) {
        setReauthError(t("security.invalidPassword")); // Use translation from security section
      } else {
        setReauthError(error.message);
      }
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const performReauthentication = async () => {
    if (!user) return false;

    setReauthError(null);
    setIsAuthenticating(true);

    const provider = user.providerData[0]?.providerId;
    let success = false;

    try {
      if (provider === "password") {
        success = await reauthenticateWithPassword();
      } else if (provider === "google.com") {
        success = await reauthenticateWithGoogle();
      } else if (provider === "github.com") {
        success = await reauthenticateWithGitHub();
      } else {
        // Default to password if provider unknown or not handled
        success = await reauthenticateWithPassword();
      }
      return success;
    } finally {
      setIsAuthenticating(false);
    }
  };

  // --- End Re-authentication Logic ---

  const handleDeleteAccount = async () => {
    if (!user) return;
    // Show re-authentication dialog first
    setShowDeleteReauthDialog(true);
  };

  const proceedWithDeletion = async () => {
    if (!user) return;

    const reauthSuccess = await performReauthentication();

    if (reauthSuccess) {
      setShowDeleteReauthDialog(false); // Close reauth dialog on success
      try {
        setIsDeleting(true);
        const authInstance = getAuth(); // Get auth instance again just in case
        await deleteUser(authInstance.currentUser!);
        toast.success(t("delete.success"));
        // User will be redirected automatically by AuthContext listener
      } catch (error) {
        logger.error("proceedWithDeletion", `Failed to delete account: ${error}`);
        toast.error(t("delete.error"));
      } finally {
        setIsDeleting(false);
      }
    }
    // If reauth fails, the error is shown in the dialog, keep it open.
  };

  if (!user) {
    return null;
  }

  // Get the first letter of the display name for the avatar fallback
  const nameInitial = user.displayName?.[0] || user.email?.[0] || "?";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("profile.title")}</CardTitle>
          <CardDescription>{t("profile.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex gap-4 items-center">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.photoURL || ""} />
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
                  {user.displayName || t("profile.noName")}
                </p>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  {t("profile.email")}
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{user.email}</p>
                  {user.emailVerified && (
                    <Badge variant="outline">
                      {t("profile.confirmed")}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div>
                <Button
                  variant="outline"
                  onClick={handleOpenEditDialog}
                >
                  {t("profile.edit")}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("data.title")}</CardTitle>
          <CardDescription>{t("data.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={handleDownloadData}
            disabled={isDownloading}
          >
            {isDownloading ? t("data.downloading") : t("data.download")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("delete.title")}</CardTitle>
          <CardDescription>{t("delete.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount} // Changed to trigger reauth dialog
            disabled={isDeleting || isAuthenticating} // Disable if deleting or authenticating
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
              <Avatar className="h-24 w-24 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <AvatarImage src={imagePreview || user.photoURL || ""} />
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
      <AlertDialog open={showDeleteReauthDialog} onOpenChange={setShowDeleteReauthDialog}>
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
          ) : user?.providerData[0]?.providerId === "password" ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reauth-password">{t("password.currentPassword")}</Label>
                <Input
                  id="reauth-password"
                  type="password"
                  value={reauthPassword}
                  onChange={(e) => setReauthPassword(e.target.value)}
                  placeholder={t("password.currentPassword")}
                />
              </div>
              {reauthError && <p className="text-sm text-destructive">{reauthError}</p>}
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <p>
                {t("security.reauth.providerMessage", {
                  provider:
                    user?.providerData[0]?.providerId === "google.com"
                      ? "Google"
                      : "GitHub",
                })}
              </p>
              {reauthError && <p className="text-sm text-destructive">{reauthError}</p>}
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
              disabled={isAuthenticating || (user?.providerData[0]?.providerId === "password" && !reauthPassword)}
            >
              {t("security.continue")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 2FA Verification Dialog (for re-authentication) */}
      <AlertDialog open={showVerify2FADialog} onOpenChange={setShowVerify2FADialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("security.verify.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("security.verify.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col items-center justify-center space-y-6 py-4">
            <div className="flex gap-2">
              <InputOTP
                maxLength={6}
                value={totpCode}
                onChange={(value) => setTotpCode(value)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            {reauthError && <p className="text-sm text-destructive">{reauthError}</p>}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={close2FADialog}>
              {t("security.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={close2FADialog}>
              {t("security.verify.verifyButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
