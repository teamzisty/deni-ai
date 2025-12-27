import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { captcha, haveIBeenPwned, lastLoginMethod } from "better-auth/plugins";
import { twoFactor } from "better-auth/plugins/two-factor";
import { db } from "@/db/drizzle";
import * as schema from "@/db/schema";
import { env } from "@/env";

export const auth = betterAuth({
  appName: "Deni AI",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    twoFactor(),
    passkey(),
    haveIBeenPwned(),
    lastLoginMethod(),
    captcha({
      provider: "cloudflare-turnstile", // or google-recaptcha, hcaptcha, captchafox
      secretKey: env.TURNSTILE_SECRET_KEY,
    }),
  ],
  socialProviders: {
    google: {
      enabled: true,
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      enabled: true,
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },
  rateLimit: {
    enabled: true,
    window: 60, // time window in seconds
    max: 100, // max requests in the window
    customRules: {
      "/sign-in/*": {
        window: 10,
        max: 3,
      },
      "/two-factor/*": async (request) => {
        // custom function to return rate limit window and max
        return {
          window: 10,
          max: 3,
        };
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
  },
});
