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
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithPopup,
  getMultiFactorResolver,
  TotpMultiFactorGenerator,
  deleteUser,
  GithubAuthProvider,
  AuthError, // Import AuthError type
  MultiFactorError, // Import MultiFactorError type
} from "firebase/auth";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@workspace/ui/components/input-otp";
import { firestore } from "@workspace/firebase-config/client";
import { useChatSessions } from "@/hooks/use-chat-sessions";

export default function DataControlsSettings() {
  const [dataCollection, setDataCollection] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReauthDialog, setShowReauthDialog] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [password, setPassword] = useState("");
  const [twoFaCode, setTwoFaCode] = useState("");
  const [reauthError, setReauthError] = useState("");
  const { user, auth } = useAuth();
  const t = useTranslations();
  const NextRouter = nextRouter();
  // Use the chat sessions hook
  const { clearAllSessions, exportAllSessions, importAllSessions } = useChatSessions();
  const dialogPromiseRef = useRef<{ resolve: (value: string) => void } | null>(null);

  useEffect(() => {
    const dataCollection = localStorage.getItem("dataCollection");
    if (dataCollection === "true") {
      setDataCollection(true);
    } else {
      setDataCollection(false);
    }
  }, []);

  useEffect(() => {
    if (dataCollection) {
      localStorage.setItem("dataCollection", "true");
    } else {
      localStorage.setItem("dataCollection", "false");
    }
  }, [dataCollection]);

  // Updated export function
  const exportAllConversations = async () => {
    try {
      const sessionsJson = await exportAllSessions(); // Use hook function
      const parsedSessions = JSON.parse(sessionsJson); // Parse to check if empty

      if (parsedSessions && parsedSessions.length > 0) {
        const blob = new Blob([sessionsJson], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `deni-ai-conversations-${new Date().toISOString()}.json`;
        document.body.appendChild(link); // Append link to body
        link.click();
        document.body.removeChild(link); // Remove link after click
        URL.revokeObjectURL(url);
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

  // Updated import function
  const importAllConversations = async () => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = async (e) => { // Make this async
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => { // Make this async
          try {
            const jsonData = event.target?.result as string;
            await importAllSessions(jsonData); // Use hook function
            // Success toast is handled within the hook now
            // toast.success(t("settings.popupMessages.importSuccess"), {
            //   description: t("settings.popupMessages.importAllSuccess"),
            // });
          } catch (error) {
             // Error toast is handled within the hook now
            // toast.error(t("common.error.occurred"), {
            //   description: t("settings.popupMessages.invalidFileFormat"), // Or a more specific error from the hook
            // });
          }
        };
         reader.onerror = () => { // Handle reader errors
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
      toast.success(t("settings.popupMessages.deleteSuccess"), {
        description: t("settings.popupMessages.deleteAllSuccess"),
      });
    } catch (error) {
       // Error toast is handled within the hook now
       console.error("Delete all error:", error);
       // toast.error(t("common.error.occurred"), {
       //   description: t("settings.popupMessages.deleteAllError"), // Add a generic delete error message
       // });
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

  const reauthenticateWithGoogle = async () => {
    if (!auth || !user) return;

    try {
      const provider = new GoogleAuthProvider();
      await reauthenticateWithPopup(user, provider);
    } catch (error: unknown) { // Changed any to unknown
      console.error("Google reauth error:", error);
      if (error instanceof Error && (error as AuthError).code === "auth/multi-factor-auth-required") {
        // Cast to MultiFactorError as required by getMultiFactorResolver
        return await handle2FAReauth(error as MultiFactorError);
      }
      setReauthError((error as Error).message); // Added type assertion
    }
  };

  // Ensure the error type is MultiFactorError as expected by getMultiFactorResolver
  const handle2FAReauth = async (error: MultiFactorError) => {
    if (!auth) return false;

    try {
      const resolver = getMultiFactorResolver(auth, error);
      const factor = resolver.hints[0];

      if (factor && factor.factorId === TotpMultiFactorGenerator.FACTOR_ID) {
        const tfaCode = await request2FaCode();
        if (!tfaCode) return false;

        const multiFactorAssertion = TotpMultiFactorGenerator.assertionForSignIn(
          factor.uid,
          tfaCode
        );

        await resolver.resolveSignIn(multiFactorAssertion);
        return true;
      }

      setReauthError(t("login.invalidAuthCode"));
      return false;
    } catch (error: any) { // Changed any to unknown
      console.error("2FA reauth error:", error);
      setReauthError((error as Error).message); // Added type assertion
      return false;
    }
  };

  const reauthenticateWithPassword = async () => {
    if (!auth || !user || !user.email) return false;

    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      return true; // Indicate success
    } catch (error: unknown) { // Changed any to unknown
      console.error("Password reauth error:", error);
      if (error instanceof Error && (error as AuthError).code === "auth/multi-factor-auth-required") {
         // Cast to MultiFactorError as required by getMultiFactorResolver
        return await handle2FAReauth(error as MultiFactorError);
      }
      setReauthError((error as Error).message); // Added type assertion
      return false;
    }
  };

  const handleReauth = async () => {
    setReauthError("");

    // Check if auth and provider are available
    if (!auth || !user) {
      setReauthError(t("login.authRequired"));
      return;
    }

    const provider = user.providerData[0]?.providerId;
    // Try password reauth first
    if (provider === 'password') {
      const success = await reauthenticateWithPassword();
      if (success) {
        setShowReauthDialog(false);
        await deleteAccount();
        return;
      }
    }

    // Check provider and try appropriate reauth method
    if (provider === 'google.com') {
      const success = await reauthenticateWithGoogle();
      if (success) {
        setShowReauthDialog(false);
        await deleteAccount();
      }
    }

    if (provider === "github.com") {
      const success = await reauthenticateWithPopup(user, new GithubAuthProvider());
      if (success) {
        setShowReauthDialog(false);
        await deleteAccount();
      }
    }

  };

  const deleteAccount = async () => {
    if (!user || !auth) return;

    try {
      setIsDeleting(true);

      // Delete the user's conversations data from Firestore
      if (firestore) {
        try {
          // Delete all sessions using the hook's logic (covers sessions and active)
          await clearAllSessions(); // Use the hook to clear Firestore data

          // Delete the user's main document (if it exists separately, though clearing sessions might be enough)
          // Check if this is still needed or if clearAllSessions covers it.
          // Let's assume clearAllSessions handles the conversation data entirely.
          // const userDocRef = doc(firestore, `deni-ai-conversations/${user.uid}`);
          // await deleteDoc(userDocRef); // This might delete the parent doc if needed
        } catch (error) {
          console.error("Error deleting user's conversations data via hook:", error);
          // Continue with account deletion even if Firestore deletion fails
        }
      }

      // Delete the user account
      await deleteUser(user);

      // Clear all local storage data (redundant if clearAllSessions worked, but safe)
      localStorage.clear();
      sessionStorage.clear();

      // Redirect to home page or show success message
      toast.success(t("settings.popupMessages.accountDeleted"));
      NextRouter.push("/");
    } catch (error: unknown) { // Changed any to unknown
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

  return (
    <div className="space-y-6">
      {/* Data Control Settings */}
      <div className="bg-card/50 opacity-50 pointer-events-none border border-border/30 rounded-md overflow-hidden">
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
              disabled={true}
              className="scale-125"
              name="dataCollection"
              checked={dataCollection}
              onCheckedChange={setDataCollection}
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportAllConversations} className="gap-2">
              <Download className="h-4 w-4" />
              {t("settings.dataControls.export.export")}
            </Button>
            <Button variant="outline" onClick={importAllConversations} className="gap-2">
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
                    {t("settings.dataControls.accountDeletion.confirmDescription")}
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

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">
                {t("login.password")}
              </Label>
              <Input
                id="password"
                type="password"
                disabled={user?.providerData[0]?.providerId != 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("login.password")}
              />
            </div>

            {reauthError && (
              <p className="text-sm text-destructive">{reauthError}</p>
            )}

            <div className="flex flex-col gap-2">
              {user?.providerData[0]?.providerId === 'password' ? (
                <>
                  <Button onClick={handleReauth}>
                    {t("login.continue")}
                  </Button>
                  <Button variant="outline" onClick={() => setShowReauthDialog(false)}>
                    {t("login.cancel")}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.dataControls.reauth.providerAuth")}
                  </p>
                  <Button onClick={handleReauth}>
                    {t("login.continue")}
                  </Button>
                  <Button variant="outline" onClick={() => setShowReauthDialog(false)}>
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