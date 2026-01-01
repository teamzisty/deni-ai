"use client";

import { AuthQueryProvider } from "@daveyplate/better-auth-tanstack";
import { AuthUIProviderTanstack } from "@daveyplate/better-auth-ui/tanstack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useExtracted } from "next-intl";
import type { ReactNode } from "react";
import { env } from "@/env";
import { ThemePresetProvider } from "@/hooks/use-theme-preset";
import { authClient } from "@/lib/auth-client";
import { makeTRPCClient } from "@/lib/trpc/client";
import { trpc } from "@/lib/trpc/react";
import { ThemeProvider } from "./ui/theme-provider";

const queryClient = new QueryClient();
const trpcClient = makeTRPCClient();

export function Providers({ children }: { children: ReactNode }) {
  const t = useExtracted();
  const router = useRouter();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ThemePresetProvider>
        <QueryClientProvider client={queryClient}>
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <AuthQueryProvider>
              <AuthUIProviderTanstack
                authClient={authClient}
                avatar={{
                  upload: async (file: File) => {
                    return await new Promise<string>((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onerror = () =>
                        reject(new Error(t("Failed to read file")));
                      reader.onload = () => {
                        const result = reader.result;
                        if (typeof result === "string") resolve(result);
                        else
                          reject(
                            new Error(t("Unexpected result from FileReader")),
                          );
                      };
                      reader.readAsDataURL(file);
                    });
                  },
                }}
                navigate={router.push}
                replace={router.replace}
                onSessionChange={() => {
                  // Clear router cache (protected routes)
                  router.refresh();
                }}
                social={{ providers: ["google", "github"] }}
                twoFactor={["totp"]}
                captcha={{
                  provider: "cloudflare-turnstile",
                  siteKey: env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
                }}
                credentials={{ forgotPassword: true }}
                emailVerification
                passkey
                Link={Link}
              >
                {children}
              </AuthUIProviderTanstack>
            </AuthQueryProvider>
          </trpc.Provider>
        </QueryClientProvider>
      </ThemePresetProvider>
    </ThemeProvider>
  );
}
