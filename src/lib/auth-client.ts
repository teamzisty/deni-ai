import { passkeyClient } from "@better-auth/passkey/client";
import {
  lastLoginMethodClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL!,
  plugins: [twoFactorClient(), lastLoginMethodClient(), passkeyClient()],
});
