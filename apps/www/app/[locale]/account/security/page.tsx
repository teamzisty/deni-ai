"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { useAuth } from "@/context/AuthContext";
import { MFAManager } from "@/components/MFAManager";
import { IntellipulseActionKeyManager } from "@/components/IntellipulseActionKeyManager";

export default function SecurityPage() {
  const { user } = useAuth();
  const t = useTranslations("account");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {t("security.title")}
        </h2>
        <p className="text-muted-foreground">{t("security.description")}</p>
      </div>

      <Card className="bg-secondary/80">
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>
            Manage your account security settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user && (
            <p className="text-sm text-destructive">
              Please log in to view security settings.
            </p>
          )}
          {user && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Account Information</h3>
                <p className="text-sm text-muted-foreground">
                  Email: {user.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  Provider: {user.app_metadata?.provider || "email"}
                </p>
              </div>

              <MFAManager />

              <IntellipulseActionKeyManager />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
