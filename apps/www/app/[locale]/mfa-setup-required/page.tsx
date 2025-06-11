"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Shield, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function MFASetupRequiredPage() {
  const t = useTranslations("account.security");
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const handleSetupMFA = () => {
    router.push("/account/security");
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/login");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-orange-100 dark:bg-orange-900/20 p-3">
              <AlertTriangle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <CardTitle className="text-xl">
            Two-Factor Authentication Required
          </CardTitle>
          <CardDescription>
            To secure your account, you must set up two-factor authentication
            before continuing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Two-factor authentication adds an extra layer of security to your
              account by requiring a verification code from your authenticator
              app.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Button onClick={handleSetupMFA} className="w-full" size="lg">
              <Shield className="mr-2 h-4 w-4" />
              Set Up Two-Factor Authentication
            </Button>

            <Button variant="outline" onClick={handleLogout} className="w-full">
              Sign Out
            </Button>
          </div>

          <div className="text-sm text-muted-foreground text-center">
            <p>You'll need an authenticator app like:</p>
            <p className="font-medium">
              Google Authenticator, Authy, or 1Password
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
