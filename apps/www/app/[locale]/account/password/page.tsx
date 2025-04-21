"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { FormEvent, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { toast } from "sonner";

export default function PasswordPage() {
  const { user } = useAuth();
  const t = useTranslations("account");
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Reset error state
    setError(null);
    
    // Validate form
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError(t("password.errorAllFields"));
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError(t("password.errorPasswordMatch"));
      return;
    }
    
    if (newPassword.length < 8) {
      setError(t("password.errorPasswordLength"));
      return;
    }
    
    if (!user || !user.email) {
      setError(t("password.errorNoUser"));
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      
      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      toast.success(t("password.successTitle"), {
        description: t("password.successDescription"),
      });
    } catch (error: any) {
      console.error("Error updating password:", error);
      if (error.code === "auth/wrong-password") {
        setError(t("password.errorWrongPassword"));
      } else if (error.code === "auth/weak-password") {
        setError(t("password.errorWeakPassword"));
      } else if (error.code === "auth/requires-recent-login") {
        setError(t("password.errorRecentLogin"));
      } else {
        setError(t("password.errorGeneric"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is signed in with a password provider
  const isPasswordProvider = user?.providerData?.some(
    provider => provider.providerId === "password"
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("password.title")}</h2>
        <p className="text-muted-foreground">{t("password.description")}</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t("password.cardTitle")}</CardTitle>
          <CardDescription>{t("password.cardDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user && (
            <p className="text-sm text-destructive">{t("password.notLoggedIn")}</p>
          )}
          
          {user && !isPasswordProvider && (
            <p className="text-sm text-destructive">{t("password.notPasswordProvider")}</p>
          )}
          
          {user && isPasswordProvider && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current">{t("password.currentPassword")}</Label>
                <Input 
                  id="current" 
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new">{t("password.newPassword")}</Label>
                <Input 
                  id="new" 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm">{t("password.confirmPassword")}</Label>
                <Input 
                  id="confirm" 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              
              <Button 
                type="submit" 
                className="mt-4" 
                disabled={isLoading}
              >
                {isLoading ? t("password.updating") : t("password.updateButton")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}