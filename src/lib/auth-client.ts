import { passkeyClient } from "@better-auth/passkey/client";
import {
  anonymousClient,
  lastLoginMethodClient,
  organizationClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const baseURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
if (!baseURL) {
  throw new Error("NEXT_PUBLIC_BETTER_AUTH_URL is required");
}

/** Path for second-factor verification after credential sign-in. */
export const TWO_FACTOR_PATH = "/auth/two-factor";

export const authClient = createAuthClient({
  baseURL,
  plugins: [
    anonymousClient(),
    twoFactorClient({
      // Prefer SPA navigation when possible; fall back is still a hard assign so
      // users never land on /chat without a completed second factor.
      onTwoFactorRedirect() {
        if (typeof window === "undefined") return;
        window.location.assign(TWO_FACTOR_PATH);
      },
    }),
    lastLoginMethodClient(),
    passkeyClient(),
    organizationClient(),
  ],
});
