"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
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
  const { user, isPending } = useAuth();
  const router = useRouter();
  
  const loadingWord = loading_words[0] || "Please wait...";

  if (isPending) {
    return (
      fallback || (
        <div className="h-screen w-screen flex items-center justify-center">
          <Loader2 className="animate-spin" />
          <span className="ml-2">{loadingWord}</span>
        </div>
      )
    );
  }

  if (!user && !isPending) {
    router.push(redirectTo);
    return null;
  }

  return <>{children}</>;
}
