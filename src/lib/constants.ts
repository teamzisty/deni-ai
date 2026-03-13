export type Author = "openai" | "anthropic" | "google" | "xai" | "openai_compatible" | "openrouter";

export enum AuthorEnum {
  openai = "OpenAI",
  anthropic = "Anthropic",
  google = "Google",
  xai = "xAI",
  openai_compatible = "OpenAI-compatible",
  openrouter = "OpenRouter",
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
    name: "GPT-5.4",
    value: "gpt-5.4",
    author: "openai",
    featured: true,
    features: ["reasoning", "smart", "fast"],
  },
  {
    name: "GPT-5.3 Codex",
    value: "gpt-5.3-codex",
    author: "openai",
    description: "The most capable agentic coding model to date.",
    features: ["coding", "reasoning", "fast"],
  },
  {
    name: "GPT-5.2 Codex",
    value: "gpt-5.2-codex",
    author: "openai",
    features: ["coding", "reasoning", "fast"],
    default: false,
  },
  {
    name: "GPT-5.2",
    value: "gpt-5.2",
    author: "openai",
    features: ["smart", "reasoning", "fast"],
    default: false,
  },
  {
    name: "GPT-5.1 Codex",
    value: "gpt-5.1-codex",
    author: "openai",
    features: ["coding", "fast"],
    default: false,
  },
  {
    name: "GPT-5.1 Codex Max",
    value: "gpt-5.1-codex-max",
    author: "openai",
    description: "A version of GPT-5.1-Codex optimized for long-running tasks.",
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
  {
    name: "GPT-5",
    value: "gpt-5",
    author: "openai",
    description: "Flagship model for coding, reasoning, and agentic tasks across domains.",
    features: ["smart", "reasoning", "fast"],
    default: false,
  },
  {
    name: "GPT-5 mini",
    value: "gpt-5-mini",
    author: "openai",
    description: "Faster, more affordable GPT-5 for well-defined tasks.",
    features: ["reasoning", "fast"],
    default: false,
  },
  {
    name: "GPT-5 nano",
    value: "gpt-5-nano",
    author: "openai",
    description: "Fastest, most cost-efficient GPT-5 model.",
    features: ["reasoning", "fast"],
    default: false,
  },
  {
    name: "GPT-4.1",
    value: "gpt-4.1",
    author: "openai",
    description: "Smartest model for fast, everyday tasks.",
    features: ["fast"],
    default: false,
  },
  {
    name: "GPT-4o",
    value: "gpt-4o",
    author: "openai",
    description: "Fast, intelligent, flexible GPT model.",
    features: ["fast"],
    default: false,
  },
  {
    name: "GPT-4o mini",
    value: "gpt-4o-mini",
    author: "openai",
    description: "Fast, affordable small model for focused tasks.",
    features: ["fast"],
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
    name: "Gemini 3.1 Pro",
    value: "gemini-3.1-pro-preview",
    author: "google",
    featured: true,
    features: ["smartest", "smart", "reasoning"],
  },
  {
    name: "Gemini 3 Pro",
    value: "gemini-3-pro-preview",
    author: "google",
    default: false,
    features: ["smart", "reasoning"],
  },
  {
    name: "Gemini 3 Flash",
    value: "gemini-3-flash-preview",
    author: "google",
    featured: true,
    features: ["reasoning", "fast"],
  },
  {
    name: "Gemini 3.1 Flash Lite",
    value: "gemini-3.1-flash-lite-preview",
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
    name: "Claude Opus 4.6",
    value: "claude-opus-4.6",
    author: "anthropic",
    premium: true,
    featured: true,
    features: ["reasoning", "smart"],
  },
  {
    name: "Claude Sonnet 4.6",
    value: "claude-sonnet-4.6",
    author: "anthropic",
    premium: true,
    featured: true,
    features: ["reasoning", "smart", "fast"],
  },
  {
    name: "Claude Sonnet 4.5",
    value: "claude-sonnet-4.5",
    author: "anthropic",
    premium: true,
    default: false,
    features: ["reasoning", "smart", "fast"],
  },
  {
    name: "Claude Haiku 4.5",
    value: "claude-haiku-4.5",
    author: "anthropic",
    description: "Fast, lightweight Claude model for everyday chat and quick reasoning.",
    featured: true,
    features: ["reasoning", "smart", "fast"],
  },
  {
    name: "Claude Opus 4.5",
    value: "claude-opus-4.5",
    author: "anthropic",
    premium: true,
    default: false,
    features: ["reasoning", "smart"],
  },
  {
    name: "Claude Opus 4.1",
    value: "claude-opus-4.1",
    author: "anthropic",
    premium: true,
    default: false,
    features: ["reasoning", "smart"],
  },
  {
    name: "Claude Opus 4",
    value: "claude-opus-4",
    author: "anthropic",
    premium: true,
    default: false,
    features: ["reasoning", "smart"],
  },
  {
    name: "Claude Sonnet 4",
    value: "claude-sonnet-4",
    author: "anthropic",
    premium: true,
    default: false,
    features: ["reasoning", "smart"],
  },
  {
    name: "Grok 4.20 Multi-Agent Beta",
    value: "grok-4.20-multi-agent-beta",
    author: "xai",
    description: "Beta Grok model for deep research with coordinated multi-agent tool use.",
    features: ["reasoning", "fast"],
  },
  {
    name: "Grok 4.20 Beta",
    value: "grok-4.20-beta",
    author: "xai",
    description: "Newest flagship Grok with lightning-fast reasoning and agentic tool calling.",
    featured: true,
    features: ["reasoning", "fast"],
  },
  {
    name: "Grok 4.1 Fast",
    value: "grok-4.1-fast",
    author: "xai",
    description:
      "Fast Grok model optimized for accurate tool calling, deep research, and low hallucination.",
    featured: true,
    features: ["reasoning", "fast"],
  },
  {
    name: "Grok 4 Fast",
    value: "grok-4-fast",
    author: "xai",
    description:
      "Cost-efficient Grok model with strong reasoning, native tool use, and real-time search.",
    default: false,
    features: ["reasoning", "fast"],
  },
  {
    name: "Grok 4",
    value: "grok-4",
    author: "xai",
    description: "Flagship Grok reasoning model with native tool use and real-time search.",
    default: false,
    features: ["reasoning"],
  },
  {
    name: "Hunter Alpha",
    value: "hunter-alpha",
    author: "openrouter",
    features: ["reasoning"],
  },
  {
    name: "Healer Alpha",
    value: "healer-alpha",
    author: "openrouter",
    features: ["reasoning"],
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
  orgInvitation: (orgName: string, inviterName: string | null, url: string) => ({
    subject: `You're invited to join ${orgName} on Deni AI`,
    html: (() => {
      const escapedOrg = escapeHtml(orgName);
      const escapedInviter = inviterName ? escapeHtml(inviterName) : "Someone";
      const escapedUrl = escapeHtml(url);

      return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You're Invited!</h2>
        <p>${escapedInviter} has invited you to join <strong>${escapedOrg}</strong> on Deni AI.</p>
        <p>Click the button below to accept the invitation:</p>
        <p style="margin: 24px 0;">
          <a href="${escapedUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a>
        </p>
        <p>If you weren't expecting this invitation, you can safely ignore this email.</p>
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
