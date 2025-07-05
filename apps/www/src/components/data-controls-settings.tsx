"use client";

import { Button } from "@workspace/ui/components/button";
import { Switch } from "@workspace/ui/components/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Trash2,
  Download,
  Upload,
  Shield,
  Database,
  FileText,
} from "lucide-react";
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
import { useSupabase } from "@/context/supabase-context";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";

export default function DataControlsSettings() {
  const [dataCollection, setDataCollection] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReauthDialog, setShowReauthDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [reauthError, setReauthError] = useState("");
  const { user, supabase } = useSupabase();

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

  // Mock export function - replace with actual implementation
  const exportAllConversations = async () => {
    try {
      // Mock data - replace with actual export logic
      const mockData = [{ id: 1, message: "Sample conversation" }];
      const fileName = `deni-ai-conversations-${new Date().toISOString()}.json`;
      saveFile(JSON.stringify(mockData), fileName);
      toast.success("Export completed successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed");
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
            toast.success("Import completed successfully!");
          } catch (error) {
            toast.error("Invalid file format");
          }
        };
        reader.onerror = () => {
          toast.error("Failed to read file");
        };
        reader.readAsText(file);
      };
      input.click();
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      toast.error("Failed to import file");
    }
  };

  // Mock delete function - replace with actual implementation
  const deleteAllConversations = async () => {
    try {
      // Add actual delete logic here
      toast.success("All conversations deleted successfully!");
    } catch (error) {
      console.error("Delete all error:", error);
      toast.error("Failed to delete conversations");
    }
  };

  const reauthenticateWithPassword = async () => {
    if (!user || !user.email || !supabase) return false;

    try {
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

  const handleReauth = async () => {
    setReauthError("");

    if (!user) {
      setReauthError("Authentication required");
      return;
    }

    const success = await reauthenticateWithPassword();
    if (success) {
      setShowReauthDialog(false);
      await deleteAccount();
    }
  };

  const deleteAccount = async () => {
    if (!user || !supabase) return;

    try {
      setIsDeleting(true);

      // Delete the user account using Supabase admin API
      const { error } = await supabase.auth.admin.deleteUser(user.id);

      if (error) {
        throw new Error(error.message);
      }

      // Clear all local storage data
      localStorage.clear();
      sessionStorage.clear();

      // Sign out
      await supabase.auth.signOut();

      toast.success("Account deleted successfully");
    } catch (error: unknown) {
      console.error("Account deletion error:", error);
      toast.error("Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) {
      toast.error("Authentication required");
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
      <Card className="!gap-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Data Collection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-grow">
              <p className="text-sm text-muted-foreground">
                Allow analytics and usage data collection
              </p>
            </div>
            <Switch
              className="scale-125"
              name="dataCollection"
              checked={dataCollection}
              onCheckedChange={toggleDataCollection}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Export/Import */}
      <Card className="!gap-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Export your conversations and data
            </p>
            <div className="flex flex-col md:flex-row gap-2">
              <Button
                variant="outline"
                onClick={exportAllConversations}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button
                variant="outline"
                onClick={importAllConversations}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Import
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
            Delete All Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Permanently delete all your conversations and data
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete All Data</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. All your conversations and
                    data will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteAllConversations}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete All
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
            Delete Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Account</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your account and all associated
                    data. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete Account"}
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
            <AlertDialogTitle>Confirm Identity</AlertDialogTitle>
            <AlertDialogDescription>
              Please enter your password to confirm this action
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
            {reauthError && (
              <p className="text-sm text-destructive">{reauthError}</p>
            )}
            <div className="flex flex-col gap-2">
              <Button onClick={handleReauth}>Continue</Button>
              <Button
                variant="outline"
                onClick={() => setShowReauthDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
