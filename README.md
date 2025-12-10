This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## tRPC + AI SDK

- API endpoint: `/api/trpc` (tRPC) with routers under `src/server/api/*`.
- Chat streaming endpoint: `POST /api/chat` using Vercel AI SDK.
- Drizzle tables: `chat`, `message` (see `src/db/schema/chat.ts`).

### Environment

- Set `OPENAI_API_KEY` in `.env` for AI responses.
- Apply schema changes:
  - `bun run db:generate`
  - `bun run db:migrate`

### Stripe Billing

Add these keys to `.env` to enable the billing page:

```
STRIPE_SECRET_KEY=sk_live_or_test
STRIPE_PRICE_PRO_MONTHLY=price_xxx
STRIPE_PRICE_PRO_QUARTERLY=price_xxx
STRIPE_PRICE_PRO_YEARLY=price_xxx
STRIPE_PRICE_MAX_YEARLY=price_xxx
STRIPE_PRICE_MAX_LIFETIME=price_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

Success/cancel URLs use `BETTER_AUTH_URL` (e.g. `http://localhost:3000`). Billing data is stored in the new `billing` table; run the Drizzle commands above after updating the schema.

### Stripe webhook

- Endpoint: `POST {BETTER_AUTH_URL}/api/stripe/webhook`
- In Stripe Dashboard → Developers → Webhooks, add the endpoint and subscribe to:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- Paste the signing secret into `STRIPE_WEBHOOK_SECRET`.
- Local dev example: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
