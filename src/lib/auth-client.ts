import { passkeyClient } from "@better-auth/passkey/client";
import {
  anonymousClient,
  lastLoginMethodClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const baseURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
if (!baseURL) {
  throw new Error("NEXT_PUBLIC_BETTER_AUTH_URL is required");
}

export const authClient = createAuthClient({
  baseURL,
  plugins: [
    anonymousClient(),
    twoFactorClient(),
    lastLoginMethodClient(),
    passkeyClient(),
  ],
});
