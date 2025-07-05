"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { FormEvent, useState } from "react";
import { useSupabase } from "@/context/supabase-context";
import { toast } from "sonner";

export default function PasswordPage() {
  const { user, supabase } = useSupabase();

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
      setError("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!user || !user.email) {
      setError("User not found");
      return;
    }
    try {
      setIsLoading(true);

      // Check if supabase is available
      if (!supabase) {
        throw new Error("Authentication service unavailable");
      }

      // Update password using Supabase
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      toast.success("Password updated", {
        description: "Your password has been successfully updated.",
      });
    } catch (error: any) {
      console.error("Error updating password:", error);
      if (error.message?.includes("Password should be at least")) {
        setError("Password is too weak. Please choose a stronger password.");
      } else {
        setError("Failed to update password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  // Check if user is signed in with a password provider
  const isPasswordProvider = user?.app_metadata?.provider === "email";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Change Password
        </h2>
        <p className="text-muted-foreground">Update your account password</p>
      </div>

      <Card className="bg-secondary/80">
        <CardHeader>
          <CardTitle>Update Password</CardTitle>
          <CardDescription>Enter your current password and choose a new one</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user && (
            <p className="text-sm text-yellow-500">
              You must be logged in to change your password
            </p>
          )}

          {user && !isPasswordProvider && (
            <p className="text-sm text-yellow-500">
              You signed in with a social provider. Password changes are not available.
            </p>
          )}

          {user && isPasswordProvider && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current">Current Password</Label>
                <Input
                  id="current"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new">New Password</Label>
                <Input
                  id="new"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm New Password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="mt-4" disabled={isLoading}>
                {isLoading
                  ? "Updating..."
                  : "Update Password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}