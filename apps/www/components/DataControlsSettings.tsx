"use client";

import { Button } from "@workspace/ui/components/button";
import { Switch } from "@workspace/ui/components/switch";
import { Trash2, Download, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter as nextRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@workspace/supabase-config/client";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@workspace/ui/components/input-otp";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { useIntellipulseSessions } from "@/hooks/use-intellipulse-sessions";

export default function DataControlsSettings() {
  const [dataCollection, setDataCollection] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReauthDialog, setShowReauthDialog] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [password, setPassword] = useState("");
  const [twoFaCode, setTwoFaCode] = useState("");  const [reauthError, setReauthError] = useState("");
  const { user } = useAuth();
  const t = useTranslations();
  const NextRouter = nextRouter();
  // Use the chat sessions hook
  const { clearAllSessions, exportAllSessions, importAllSessions } =
    useChatSessions();
  const {
    exportAllSessions: exportAllDevSessions,
    importAllSessions: importAllDevSessions,
    clearAllSessions: clearAllDevSessions,
  } = useIntellipulseSessions();
  const dialogPromiseRef = useRef<{ resolve: (value: string) => void } | null>(
    null
  );

  useEffect(() => {
    // Read the 'analytics-consent' cookie on component mount
    const cookieValue = document.cookie
      .split("; ")
      .find((row) => row.startsWith("analytics-consent="))
      ?.split("=")[1];

    if (cookieValue === "true") {
      setDataCollection(true);
    } else {
      // If cookie is "false", not set, or any other value, default dataCollection to false
      setDataCollection(false);
    }

    console.log("Cookie value:", cookieValue); // Debugging line
  }, []); // Runs once on mount

  const saveFile = (jsonData: string, fileName: string) => {
    const blob = new Blob([jsonData], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link); // Append link to body
    link.click();
    document.body.removeChild(link); // Remove link after click
    URL.revokeObjectURL(url);
  };

  // Updated export function
  const exportAllConversations = async () => {
    try {
      const sessionsJson = await exportAllSessions(); // Use hook function
      const parsedSessions = JSON.parse(sessionsJson); // Parse to check if empty

      if (parsedSessions && parsedSessions.length > 0) {
        const fileName = `deni-ai-conversations-${new Date().toISOString()}.json`;
        saveFile(sessionsJson, fileName); // Save the file
        toast.success(t("settings.popupMessages.exportSuccess"));
      } else {
        toast.error(t("common.error.occurred"), {
          description: t("settings.popupMessages.noConversations"),
        });
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error(t("common.error.occurred"), {
        description: t("settings.popupMessages.exportError"), // Add a generic export error message
      });
    }
  };

  const exportAllDevConversations = async () => {
    try {
      const sessionsJson = await exportAllDevSessions(); // Use hook function
      const parsedSessions = JSON.parse(sessionsJson); // Parse to check if empty

      if (parsedSessions && parsedSessions.length > 0) {
        const fileName = `deni-ai-dev-conversations-${new Date().toISOString()}.json`;
        saveFile(sessionsJson, fileName); // Save the file
        toast.success(t("settings.popupMessages.exportSuccess"));
      } else {
        toast.error(t("common.error.occurred"), {
          description: t("settings.popupMessages.noConversations"),
        });
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error(t("common.error.occurred"), {
        description: t("settings.popupMessages.exportError"), // Add a generic export error message
      });
    }
  };

  const importAllDevConversations = async () => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = async (e) => {
        // Make this async
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
          // Make this async
          try {
            const jsonData = event.target?.result as string;
            await importAllDevSessions(jsonData); // Use hook function
            // Success toast is handled within the hook now
            toast.success(t("settings.popupMessages.importSuccess"), {
              description: t("settings.popupMessages.importAllSuccess"),
            });
          } catch (error) {
            // Error toast is handled within the hook now
            toast.error(t("common.error.occurred"), {
              description: t("settings.popupMessages.invalidFileFormat"), // Or a more specific error from the hook
            });
          }
        };
        reader.onerror = () => {
          // Handle reader errors
          toast.error(t("common.error.occurred"), {
            description: t("settings.popupMessages.fileReadError"),
          });
        };
        reader.readAsText(file);
      };
      input.click();
    } catch (error: unknown) {
      // This catch block might be less likely to trigger now,
      // but keep it for unexpected issues creating the input element.
      if (error instanceof Error && error.name === "AbortError") {
        // User cancelled file selection
        return;
      }
      toast.error(t("common.error.occurred"), {
        description: t("settings.popupMessages.fileReadError"), // Or a generic import error
      });
    }
  };

  // Updated import function
  const importAllConversations = async () => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = async (e) => {
        // Make this async
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
          // Make this async
          try {
            const jsonData = event.target?.result as string;
            await importAllSessions(jsonData); // Use hook function
            // Success toast is handled within the hook now
            toast.success(t("settings.popupMessages.importSuccess"), {
              description: t("settings.popupMessages.importAllSuccess"),
            });
          } catch (error) {
            // Error toast is handled within the hook now
            toast.error(t("common.error.occurred"), {
              description: t("settings.popupMessages.invalidFileFormat"), // Or a more specific error from the hook
            });
          }
        };
        reader.onerror = () => {
          // Handle reader errors
          toast.error(t("common.error.occurred"), {
            description: t("settings.popupMessages.fileReadError"),
          });
        };
        reader.readAsText(file);
      };
      input.click();
    } catch (error: unknown) {
      // This catch block might be less likely to trigger now,
      // but keep it for unexpected issues creating the input element.
      if (error instanceof Error && error.name === "AbortError") {
        // User cancelled file selection
        return;
      }
      toast.error(t("common.error.occurred"), {
        description: t("settings.popupMessages.fileReadError"), // Or a generic import error
      });
    }
  };

  // Updated delete function (now async)
  const deleteAllConversations = async () => {
    try {
      await clearAllSessions(); // Use hook function
    } catch (error) {
      // Error toast is handled within the hook now
      console.error("Delete all error:", error);
      toast.error(t("common.error.occurred"), {
        description: t("settings.popupMessages.deleteAllError"), // Add a generic delete error message
      });
    }
  };

  // Updated delete function (now async)
  const deleteAllDevConversations = async () => {
    try {
      await clearAllDevSessions(); // Use hook function
    } catch (error) {
      // Error toast is handled within the hook now
      console.error("Delete all error:", error);
      toast.error(t("common.error.occurred"), {
        description: t("settings.popupMessages.deleteAllError"), // Add a generic delete error message
      });
    }
  };

  const request2FaCode = () => {
    return new Promise<string>((resolve) => {
      setShow2FADialog(true);
      dialogPromiseRef.current = { resolve };
    });
  };
  const close2FADialog = () => {
    setShow2FADialog(false);
    if (dialogPromiseRef.current) {
      dialogPromiseRef.current.resolve(twoFaCode);
      dialogPromiseRef.current = null;
    }
  };
  const reauthenticateWithPassword = async () => {
    if (!user || !user.email || !supabase) return false;

    try {
      // For Supabase, we use signInWithPassword for reauthentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (error) {
        console.error("Password reauth error:", error);
        setReauthError(error.message);
        return false;
      }

      return true;
    } catch (error: unknown) {
      console.error("Password reauth error:", error);
      setReauthError((error as Error).message);
      return false;
    }
  };

  const reauthenticateWithProvider = async (provider: 'google' | 'github') => {
    if (!supabase) return false;

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        console.error(`${provider} reauth error:`, error);
        setReauthError(error.message);
        return false;
      }

      return true;
    } catch (error: unknown) {
      console.error(`${provider} reauth error:`, error);
      setReauthError((error as Error).message);
      return false;
    }
  };

  const handleReauth = async () => {
    setReauthError("");

    if (!user) {
      setReauthError(t("login.authRequired"));
      return;
    }

    // For Supabase, we check the app_metadata for the provider
    const provider = user.app_metadata?.provider;

    // Try password reauth first
    if (provider === "email") {
      const success = await reauthenticateWithPassword();
      if (success) {
        setShowReauthDialog(false);
        await deleteAccount();
        return;
      }
    }

    // Check provider and try appropriate reauth method
    if (provider === "google") {
      const success = await reauthenticateWithProvider('google');
      if (success) {
        setShowReauthDialog(false);
        await deleteAccount();
      }
    }

    if (provider === "github") {
      const success = await reauthenticateWithProvider('github');
      if (success) {
        setShowReauthDialog(false);
        await deleteAccount();
      }
    }
  };
  const deleteAccount = async () => {
    if (!user || !supabase) return;

    try {
      setIsDeleting(true);

      // Delete the user's conversations data
      try {
        // Delete all sessions using the hook's logic
        await clearAllSessions();
        await clearAllDevSessions();
      } catch (error) {
        console.error(
          "Error deleting user's conversations data via hook:",
          error
        );
        // Continue with account deletion even if data deletion fails
      }

      // Delete the user account using Supabase admin API
      // Note: This would typically be done on the server side
      const { error } = await supabase.auth.admin.deleteUser(user.id);

      if (error) {
        throw new Error(error.message);
      }

      // Clear all local storage data
      localStorage.clear();
      sessionStorage.clear();

      // Sign out
      await supabase.auth.signOut();

      // Redirect to home page or show success message
      toast.success(t("settings.popupMessages.accountDeleted"));
      NextRouter.push("/");
    } catch (error: unknown) {
      console.error("Account deletion error:", error);
      toast.error(t("common.error.occurred"), {
        description: t("settings.popupMessages.accountDeletionError"),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) {
      toast.error(t("common.error.occurred"), {
        description: t("settings.popupMessages.accountDeletionError"),
      });
      return;
    }

    // Show reauth dialog
    setShowReauthDialog(true);
  };

  const toggleDataCollection = async (checked: boolean) => {
    setDataCollection(checked);
    const cookieValue = checked ? "true" : "false";
    document.cookie = `analytics-consent=${cookieValue}; path=/; max-age=31536000`; // 1 year
  };

  return (
    <div className="space-y-6">
      {/* Data Control Settings */}
      <div className="bg-card/50 border border-border/30 rounded-md overflow-hidden">
        <div className="flex p-5 items-center gap-4">
          <div className="flex-grow">
            <h3 className="text-lg font-bold">
              {t("settings.dataControls.dataCollection.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("settings.dataControls.dataCollection.description")}
            </p>
          </div>
          <div>
            <Switch
              className="scale-125"
              name="dataCollection"
              checked={dataCollection}
              onCheckedChange={toggleDataCollection}
            />
          </div>
        </div>
      </div>

      {/* Data Export/Import */}
      <div className="bg-card/50 border border-border/30 rounded-md overflow-hidden">
        <div className="flex flex-col p-5 gap-4">
          <div className="flex-grow">
            <h3 className="text-lg font-bold">
              {t("settings.dataControls.export.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("settings.dataControls.export.description")}
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <Button
              variant="outline"
              onClick={exportAllConversations}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {t("settings.dataControls.export.export")}
            </Button>
            <Button
              variant="outline"
              onClick={importAllConversations}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {t("settings.dataControls.export.import")}
            </Button>
          </div>
        </div>
      </div>

      {/* Dev Data Export/Import */}
      <div className="bg-card/50 border border-border/30 rounded-md overflow-hidden">
        <div className="flex flex-col p-5 gap-4">
          <div className="flex-grow">
            <h3 className="text-lg font-bold">
              {t("settings.dataControls.devExport.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("settings.dataControls.devExport.description")}
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <Button
              variant="outline"
              onClick={exportAllDevConversations}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {t("settings.dataControls.export.export")}
            </Button>
            <Button
              variant="outline"
              onClick={importAllDevConversations}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {t("settings.dataControls.export.import")}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete All Data */}
      <div className="bg-card/50 border border-border/30 rounded-md overflow-hidden">
        <div className="flex p-5 items-center gap-4">
          <div className="flex-grow">
            <h3 className="text-lg font-bold text-destructive">
              {t("settings.dataControls.deleteData.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("settings.dataControls.deleteData.description")}
            </p>
          </div>
          <div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  {t("settings.dataControls.deleteData.action")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t("settings.dataControls.deleteData.confirmTitle")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("settings.dataControls.deleteData.confirmDescription")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {t("settings.dataControls.deleteData.cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteAllConversations} // Use updated async function
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t("settings.dataControls.deleteData.confirm")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <div className="bg-card/50 border border-border/30 rounded-md overflow-hidden">
        <div className="flex p-5 items-center gap-4">
          <div className="flex-grow">
            <h3 className="text-lg font-bold text-destructive">
              {t("settings.dataControls.deleteDevData.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("settings.dataControls.deleteDevData.description")}
            </p>
          </div>
          <div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  {t("settings.dataControls.deleteData.action")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t("settings.dataControls.deleteData.confirmTitle")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("settings.dataControls.deleteData.confirmDescription")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {t("settings.dataControls.deleteData.cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteAllDevConversations} // Use updated async function
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t("settings.dataControls.deleteData.confirm")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Account Deletion */}
      <div className="bg-card/50 border border-border/30 rounded-md overflow-hidden">
        <div className="flex p-5 items-center gap-4">
          <div className="flex-grow">
            <h3 className="text-lg font-bold text-destructive">
              {t("settings.dataControls.accountDeletion.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("settings.dataControls.accountDeletion.description")}
            </p>
          </div>
          <div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  {t("settings.dataControls.accountDeletion.action")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t("settings.dataControls.accountDeletion.confirmTitle")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t(
                      "settings.dataControls.accountDeletion.confirmDescription"
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {t("settings.dataControls.accountDeletion.cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeleting}
                  >
                    {isDeleting
                      ? t("settings.dataControls.accountDeletion.deleting")
                      : t("settings.dataControls.accountDeletion.confirm")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Reauthentication Dialog */}
      <AlertDialog open={showReauthDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("settings.dataControls.reauth.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings.dataControls.reauth.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">            <div className="space-y-2">
              <Label htmlFor="password">{t("login.password")}</Label>
              <Input
                id="password"
                type="password"
                disabled={user?.app_metadata?.provider !== "email"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("login.password")}
              />
            </div>

            {reauthError && (
              <p className="text-sm text-destructive">{reauthError}</p>
            )}

            <div className="flex flex-col gap-2">
              {user?.app_metadata?.provider === "email" ? (
                <>
                  <Button onClick={handleReauth}>{t("login.continue")}</Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowReauthDialog(false)}
                  >
                    {t("login.cancel")}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.dataControls.reauth.providerAuth")}
                  </p>
                  <Button onClick={handleReauth}>{t("login.continue")}</Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowReauthDialog(false)}
                  >
                    {t("login.cancel")}
                  </Button>
                </>
              )}
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* 2FA Dialog */}
      <AlertDialog open={show2FADialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("login.twoFactorRequired")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("login.twoFactorDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Label className="text-muted-foreground" htmlFor="twoFaCode">
            {t("login.twoFactorCode")}
          </Label>
          <InputOTP
            maxLength={6}
            value={twoFaCode}
            onChange={(e) => setTwoFaCode(e)}
            required
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={close2FADialog}>
              {t("login.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={close2FADialog}>
              {t("login.continue")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
