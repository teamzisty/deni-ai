"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { useSupabase } from "@/context/supabase-context";

export default function SecurityPage() {
  const { user } = useSupabase();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Security Settings
        </h2>
        <p className="text-muted-foreground">Manage your account security settings</p>
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
                <p className="text-sm text-muted-foreground">
                  Account Created: {new Date(user.created_at).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Last Sign In: {new Date(user.last_sign_in_at || user.created_at).toLocaleDateString()}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium">Security Options</h3>
                <p className="text-sm text-muted-foreground">
                  Additional security features will be available here in the future.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}