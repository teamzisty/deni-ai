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
import { deleteUser, getAuth } from "firebase/auth";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@repo/ui/components/badge";

export function AccountSettings() {
  const t = useTranslations("account");
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadData = async () => {
    try {
      setIsDownloading(true);
      // TODO: Implement data download logic
      const userData = {
        profile: {
          name: user?.displayName,
          email: user?.email,
          photoURL: user?.photoURL,
        },
        // Add other user data as needed
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

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      setIsDeleting(true);
      const auth = getAuth();
      await deleteUser(auth.currentUser!);
      toast.success(t("delete.success"));
    } catch (error) {
      console.error("Failed to delete account:", error);
      toast.error(t("delete.error"));
    } finally {
      setIsDeleting(false);
    }
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

      <div className="flex items-center gap-x-8">
        <Avatar className="h-20 w-20">
          <AvatarImage src={user.photoURL || ""} />
          <AvatarFallback className="text-2xl">{nameInitial}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <div className="flex items-center gap-x-2">
            <h3 className="text-xl font-semibold">{user.displayName || user.email}</h3>
            {user.emailVerified && (
              <Badge variant="outline" className="ml-2">{t("profile.confirmed")}</Badge>
            )}
          </div>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <div className="ml-auto">
          <Button variant="outline">{t("profile.edit")}</Button>
        </div>
      </div>

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
            onClick={handleDeleteAccount}
            disabled={isDeleting}
          >
            {isDeleting ? t("delete.deleting") : t("delete.button")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
