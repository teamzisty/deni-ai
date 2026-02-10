import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
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
import { Resend } from "resend";
import { db } from "@/db/drizzle";
import * as schema from "@/db/schema";
import { env } from "@/env";
import { EMAIL_FROM, emailTemplates } from "@/lib/constants";
import { updateTeamSeatCount } from "@/lib/team-billing";

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
          const template = emailTemplates.resetPassword(user.name, url);
          await resend.emails.send({
            from: EMAIL_FROM,
            to: user.email,
            subject: template.subject,
            html: template.html,
          });
        }
      : undefined,
  },
  emailVerification: resend
    ? {
        sendVerificationEmail: async ({ user, url }) => {
          const template = emailTemplates.verifyEmail(user.name, url);
          await resend.emails.send({
            from: EMAIL_FROM,
            to: user.email,
            subject: template.subject,
            html: template.html,
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
        afterAcceptInvitation: async ({ organization }) => {
          await updateTeamSeatCount(organization.id);
        },
        afterRemoveMember: async ({ organization }) => {
          await updateTeamSeatCount(organization.id);
        },
      },
      sendInvitationEmail: resend
        ? async (data) => {
            const url = `${env.NEXT_PUBLIC_BETTER_AUTH_URL}/settings/team?invitationId=${data.id}`;
            const template = emailTemplates.orgInvitation(
              data.organization.name,
              data.inviter.user.name,
              url,
            );
            await resend.emails.send({
              from: EMAIL_FROM,
              to: data.email,
              subject: template.subject,
              html: template.html,
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
              const template = emailTemplates.magicLink(url);
              await resend.emails.send({
                from: EMAIL_FROM,
                to: email,
                subject: template.subject,
                html: template.html,
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
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
  },
});
