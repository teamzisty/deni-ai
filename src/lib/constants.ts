export type Author =
  | "openai"
  | "anthropic"
  | "google"
  | "xai"
  | "openai_compatible";

export enum AuthorEnum {
  openai = "OpenAI",
  anthropic = "Anthropic",
  google = "Google",
  xai = "xAI",
  openai_compatible = "OpenAI-compatible",
}

export type Models = {
  [key: string]: {
    author: Author;
    model: string;
    label: string;
    provider: string;
  };
};

export const models = [
  {
    name: "GPT-5.2",
    value: "gpt-5.2",
    author: "openai",
    features: ["reasoning", "smart", "fast"],
  },
  {
    name: "GPT-5.1 Codex",
    value: "gpt-5.1-codex",
    author: "openai",
    features: ["coding", "fast"],
    default: false,
  },
  {
    name: "GPT-5.1 Codex mini",
    value: "gpt-5.1-codex-mini",
    author: "openai",
    features: ["coding", "fast"],
    default: false,
  },
  // {
  //   name: "GPT-5 Pro",
  //   value: "gpt-5-pro",
  //   description: "For hard tasks",
  //   author: "openai",
  //   features: ["smart", "reasoning"],
  // },
  {
    name: "GPT-oss 120b",
    value: "openai/gpt-oss-120b",
    author: "openai",
    provider: "groq",
    features: ["reasoning", "fast"],
  },
  {
    name: "GPT-oss 20b",
    value: "openai/gpt-oss-20b",
    author: "openai",
    provider: "groq",
    features: ["reasoning", "fastest", "fast"],
  },
  {
    name: "Gemini 3 Pro",
    value: "gemini-3-pro-preview",
    author: "google",
    features: ["smartest", "smart", "reasoning"],
  },
  {
    name: "Gemini 2.5 Flash",
    value: "gemini-2.5-flash",
    author: "google",
    features: ["reasoning", "fast"],
  },
  {
    name: "Gemini 2.5 Flash Lite",
    value: "gemini-2.5-flash-lite",
    author: "google",
    features: ["reasoning", "fast"],
    default: false,
  },
  {
    name: "Claude Sonnet 4.5",
    value: "claude-sonnet-4.5",
    author: "anthropic",
    premium: true,
    features: ["reasoning", "smart", "fast"],
  },
  {
    name: "Claude Opus 4.5",
    value: "claude-opus-4.5",
    author: "anthropic",
    premium: true,
    features: ["reasoning", "smart"],
  },
  {
    name: "Claude Opus 4.1",
    value: "claude-opus-4.1",
    author: "anthropic",
    premium: true,
    features: ["reasoning"],
    default: false,
  },
  {
    name: "Grok 4",
    value: "grok-4-0709",
    author: "xai",
    features: ["reasoning"],
  },
  {
    name: "Grok 4 Fast (Reasoning)",
    value: "grok-4-fast-reasoning",
    author: "xai",
    features: ["reasoning", "fast"],
  },
  {
    name: "Grok 4 Fast (Non-Reasoning)",
    value: "grok-4-fast-non-reasoning",
    author: "xai",
    features: ["fast"],
  },
];

// Google Analytics
export const GA_ID = "G-B5H8G73JTN";

// Email configuration
export const EMAIL_FROM = "Deni AI <noreply@deniai.app>";

const escapeHtml = (unsafe: string) =>
  unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Email templates
export const emailTemplates = {
  resetPassword: (name: string | null, url: string) => ({
    subject: "Reset your password - Deni AI",
    html: (() => {
      const escapedName = name ? escapeHtml(name) : "";
      const escapedUrl = escapeHtml(url);

      return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Your Password</h2>
        <p>Hi${escapedName ? ` ${escapedName}` : ""},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <p style="margin: 24px 0;">
          <a href="${escapedUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        </p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
        <p>Best,<br>Deni AI Team</p>
      </div>
    `;
    })(),
  }),
  verifyEmail: (name: string | null, url: string) => ({
    subject: "Verify your email - Deni AI",
    html: (() => {
      const escapedName = name ? escapeHtml(name) : "";
      const escapedUrl = escapeHtml(url);

      return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify Your Email</h2>
        <p>Hi${escapedName ? ` ${escapedName}` : ""},</p>
        <p>Thank you for signing up for Deni AI! Please verify your email address by clicking the button below:</p>
        <p style="margin: 24px 0;">
          <a href="${escapedUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a>
        </p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
        <p>Best,<br>Deni AI Team</p>
      </div>
    `;
    })(),
  }),
  magicLink: (url: string) => ({
    subject: "Sign in to Deni AI",
    html: (() => {
      const escapedUrl = escapeHtml(url);

      return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Sign In to Deni AI</h2>
        <p>Click the button below to sign in:</p>
        <p style="margin: 24px 0;">
          <a href="${escapedUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Sign In</a>
        </p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>Best,<br>Deni AI Team</p>
      </div>
    `;
    })(),
  }),
};
