# Setup

This guide covers prerequisites, environment configuration, database setup, and deployment.

## Prerequisites

- [Bun](https://bun.sh/) (recommended) or [Node.js 20+](https://nodejs.org/)
- [PostgreSQL database](https://neon.tech/) (Neon serverless recommended)
- API keys for AI providers (at least one required)
- OAuth credentials for authentication providers

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/teamzisty/deni-ai.git
cd deni-ai
```

### 2. Install dependencies

```bash
bun install
# or
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# App URL
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# Authentication
BETTER_AUTH_SECRET=your-32-character-secret-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# AI Providers (at least one required)
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-key
GROQ_API_KEY=gsk-your-groq-key
OPENROUTER_API_KEY=sk-or-your-openrouter-key

# Search (optional)
BRAVE_SEARCH_API_KEY=your-brave-search-key

# Stripe (optional, can disable with NEXT_PUBLIC_BILLING_DISABLED=true)
STRIPE_SECRET_KEY=sk_test_your-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Turnstile (Cloudflare CAPTCHA)
TURNSTILE_SECRET_KEY=your-turnstile-secret
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-turnstile-site-key

# Optional: Disable billing
NEXT_PUBLIC_BILLING_DISABLED=1
```

#### Generate `BETTER_AUTH_SECRET`

```bash
openssl rand -base64 32
```

#### Setting up OAuth Providers

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

**GitHub OAuth:**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

### 4. Set up the database

Generate and run database migrations:

```bash
# Generate migration files
bun run db:generate

# Apply migrations
bun run db:migrate

# Or push schema directly (development)
bun run db:push
```

Generate better-auth schema:

```bash
bun run auth:generate
```

### 5. Run the development server

```bash
bun dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start development server |
| `bun run build` | Build for production |
| `bun start` | Start production server |
| `bun run lint` | Run Biome linter |
| `bun run format` | Format code with Biome |
| `bun run db:generate` | Generate Drizzle migrations |
| `bun run db:migrate` | Run database migrations |
| `bun run db:push` | Push schema to database |
| `bun run auth:generate` | Regenerate better-auth schema |

## Stripe Billing Setup (Optional)

If you want to enable Stripe billing:

1. Create a [Stripe account](https://stripe.com/)
2. Get your API keys from the Stripe Dashboard
3. Add to `.env`:

```env
STRIPE_SECRET_KEY=sk_test_your-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

4. Set up webhook endpoint:
   - Endpoint URL: `{NEXT_PUBLIC_BETTER_AUTH_URL}/api/stripe/webhook`
   - Events to listen to:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

5. For local testing:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

To disable billing entirely:

```env
NEXT_PUBLIC_BILLING_DISABLED=true
```

## Database Schema

The application uses the following main tables:

- **Authentication** - Users, sessions, accounts (better-auth schema)
- **Chats** - Chat conversations and messages
- **Provider Keys** - User-specific API keys for AI providers
- **Provider Settings** - User preferences for AI providers
- **Custom Models** - User-defined custom AI models
- **Billing** - Subscription and payment data (Stripe)
- **Usage** - Track API usage and limits
- **Share** - Share chat conversations

To modify the schema:

1. Edit files in `src/db/schema/`
2. Run `bun run db:generate` to create migrations
3. Run `bun run db:migrate` to apply migrations

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The application can be deployed to any platform that supports Next.js:

- Railway
- Render
- Fly.io
- AWS/GCP/Azure

Make sure to:
- Set all required environment variables
- Use PostgreSQL database
- Configure proper build commands: `bun run build`
- Start command: `bun start`
