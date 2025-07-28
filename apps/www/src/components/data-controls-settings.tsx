"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Trash2, Download, Upload, Database, FileText } from "lucide-react";
import { useState } from "react";
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
import { useAuth } from "@/context/auth-context";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { useTranslations } from "@/hooks/use-translations";

export default function DataControlsSettings() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReauthDialog, setShowReauthDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [reauthError, setReauthError] = useState("");
  const { user } = useAuth();
  const t = useTranslations("dataControls");

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

  // Mock export function - replace with actual implementation
  const exportAllConversations = async () => {
    try {
      // Mock data - replace with actual export logic
      const mockData = [{ id: 1, message: "Sample conversation" }];
      const fileName = `deni-ai-conversations-${new Date().toISOString()}.json`;
      saveFile(JSON.stringify(mockData), fileName);
      toast.success(t("export.success"));
    } catch (error) {
      console.error("Export error:", error);
      toast.error(t("export.failed"));
    }
  };

  // Mock import function - replace with actual implementation
  const importAllConversations = async () => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const jsonData = event.target?.result as string;
            // Add actual import logic here
            toast.success(t("import.success"));
          } catch (error) {
            toast.error(t("import.invalidFormat"));
          }
        };
        reader.onerror = () => {
          toast.error(t("import.readFailed"));
        };
        reader.readAsText(file);
      };
      input.click();
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      toast.error(t("import.failed"));
    }
  };

  // Mock delete function - replace with actual implementation
  const deleteAllConversations = async () => {
    try {
      // Add actual delete logic here
      toast.success(t("deleteAll.success"));
    } catch (error) {
      console.error("Delete all error:", error);
      toast.error(t("deleteAll.failed"));
    }
  };

  // const deleteAccount = async () => {
  //   if (!user) return;

  //   try {
  //     setIsDeleting(true);

  //     // Delete the user account using Supabase admin API
  //     const { error } = await deleteUser(user.id);

  //     if (error) {
  //       throw new Error(error.message);
  //     }

  //     // Clear all local storage data
  //     localStorage.clear();
  //     sessionStorage.clear();

  //     // Sign out
  //     await supabase.auth.signOut();

  //     toast.success(t("deleteAccount.success"));
  //   } catch (error: unknown) {
  //     console.error("Account deletion error:", error);
  //     toast.error(t("deleteAccount.failed"));
  //   } finally {
  //     setIsDeleting(false);
  //   }
  // };

  const handleDeleteAccount = async () => {
    if (!user) {
      toast.error(t("reauth.authRequired"));
      return;
    }

    // Show reauth dialog
    setShowReauthDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Data Export/Import */}
      <Card className="!gap-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("export.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("export.description")}
            </p>
            <div className="flex flex-col md:flex-row gap-2">
              <Button
                variant="outline"
                onClick={exportAllConversations}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                {t("export.button")}
              </Button>
              <Button
                variant="outline"
                onClick={importAllConversations}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                {t("import.button")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete All Data */}
      <Card className="!gap-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Database className="h-5 w-5" />
            {t("deleteAll.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {t("deleteAll.description")}
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  {t("deleteAll.button")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t("deleteAll.dialogTitle")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("deleteAll.dialogDescription")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteAllConversations}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t("deleteAll.confirmButton")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Account Deletion */}
      <Card className="!gap-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            {t("deleteAccount.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {t("deleteAccount.description")}
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  {t("deleteAccount.button")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t("deleteAccount.dialogTitle")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("deleteAccount.dialogDescription")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeleting}
                  >
                    {isDeleting
                      ? t("deleteAccount.deleting")
                      : t("deleteAccount.confirmButton")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Reauthentication Dialog */}
      <AlertDialog open={showReauthDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("reauth.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("reauth.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t("reauth.passwordLabel")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("reauth.passwordPlaceholder")}
              />
            </div>
            {reauthError && (
              <p className="text-sm text-destructive">{reauthError}</p>
            )}
            <div className="flex flex-col gap-2">
              {/* Todo: Add reauth logic
              <Button onClick={handleReauth}>
                {t("reauth.continueButton")}
              </Button>
               */}
              <Button
                variant="outline"
                onClick={() => setShowReauthDialog(false)}
              >
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
