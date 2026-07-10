import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import {
  anonymous,
  bearer,
  captcha,
  haveIBeenPwned,
  lastLoginMethod,
  magicLink,
  organization,
} from "better-auth/plugins";
import { twoFactor } from "better-auth/plugins/two-factor";
import { createElement } from "react";
import { Resend } from "resend";
import { db } from "@/db/drizzle";
import * as schema from "@/db/schema";
import { MagicLinkEmail, magicLinkEmailSubject } from "@/emails/magic-link-email";
import { OrgInvitationEmail, orgInvitationEmailSubject } from "@/emails/org-invitation-email";
import { PasswordResetEmail, passwordResetEmailSubject } from "@/emails/password-reset-email";
import { VerificationEmail, verificationEmailSubject } from "@/emails/verification-email";
import { env } from "@/env";
import { EMAIL_FROM } from "@/lib/constants";
import { isDisposableEmail } from "@/lib/disposable-email";
import { cancelPersonalSubscription, updateTeamSeatCount } from "@/lib/team-billing";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export const auth = betterAuth({
  appName: "Deni AI",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: !!resend,
    sendResetPassword: resend
      ? async ({ user, url }) => {
          await resend.emails.send({
            from: EMAIL_FROM,
            to: user.email,
            subject: passwordResetEmailSubject,
            react: createElement(PasswordResetEmail, {
              name: user.name,
              resetUrl: url,
            }),
          });
        }
      : undefined,
  },
  emailVerification: resend
    ? {
        sendVerificationEmail: async ({ user, url }) => {
          await resend.emails.send({
            from: EMAIL_FROM,
            to: user.email,
            subject: verificationEmailSubject,
            react: createElement(VerificationEmail, {
              name: user.name,
              verificationUrl: url,
            }),
          });
        },
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
      }
    : undefined,
  plugins: [
    anonymous(),
    twoFactor(),
    passkey(),
    haveIBeenPwned(),
    lastLoginMethod(),
    organization({
      allowUserToCreateOrganization: true,
      membershipLimit: 50,
      organizationHooks: {
        afterAcceptInvitation: async ({ organization, member }) => {
          await updateTeamSeatCount(organization.id);
          await cancelPersonalSubscription(member.userId);
        },
        afterRemoveMember: async ({ organization }) => {
          await updateTeamSeatCount(organization.id);
        },
      },
      sendInvitationEmail: resend
        ? async (data) => {
            const url = `${env.NEXT_PUBLIC_BETTER_AUTH_URL}/settings/team?invitationId=${data.id}`;
            await resend.emails.send({
              from: EMAIL_FROM,
              to: data.email,
              subject: orgInvitationEmailSubject(data.organization.name),
              react: createElement(OrgInvitationEmail, {
                orgName: data.organization.name,
                inviterName: data.inviter.user.name,
                acceptUrl: url,
              }),
            });
          }
        : undefined,
    }),
    captcha({
      provider: "cloudflare-turnstile",
      secretKey: env.TURNSTILE_SECRET_KEY,
    }),
    bearer(),
    ...(resend
      ? [
          magicLink({
            sendMagicLink: async ({ email, url }) => {
              await resend.emails.send({
                from: EMAIL_FROM,
                to: email,
                subject: magicLinkEmailSubject,
                react: createElement(MagicLinkEmail, {
                  signInUrl: url,
                }),
              });
            },
          }),
        ]
      : []),
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
      "/two-factor/*": async (_request) => {
        // custom function to return rate limit window and max
        return {
          window: 10,
          max: 3,
        };
      },
    },
  },
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
  },
  experimental: { joins: true },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (user.email && isDisposableEmail(user.email)) {
            throw new APIError("BAD_REQUEST", {
              message: "Disposable email addresses are not allowed.",
              code: "DISPOSABLE_EMAIL_NOT_ALLOWED",
            });
          }
        },
      },
    },
  },
});
