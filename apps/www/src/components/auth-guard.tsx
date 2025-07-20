"use client";

import { useSupabase } from "@/context/supabase-context";
import { useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { loading_words } from "@/lib/constants";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function AuthGuard({
  children,
  fallback,
  redirectTo = "/auth/login",
}: AuthGuardProps) {
  const { user, loading } = useSupabase();

  const [loadingWord, setLoadingWord] = useState<string | undefined>();
  const router = useRouter();

  useEffect(() => {
    setLoadingWord(
      loading_words[Math.floor(Math.random() * loading_words.length)],
    );
    if (!loading && !user) {
      router.push(redirectTo);
    }
  }, [loading, user, router, redirectTo]);

  if (loading) {
    return (
      fallback || (
        <div className="h-screen w-screen flex items-center justify-center">
          <Loader2 className="animate-spin" />
          <span className="ml-2">{loadingWord}</span>
        </div>
      )
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
