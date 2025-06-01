---
title: "Create Your Own Instance"
description: "This page explains how to create your own instance."
category: "docs"
---

## Prerequisites

- Node.js (v18.18.0) or later
- Latest version of pnpm
- (Optional) Supabase project setup (For Supabase setup, see "Supabase Setup" below)
- (Optional) Brave Search API key (used for search)
- (Optional) Uploadthing token (used for image uploads)

### Supabase Setup (Optional)

For Supabase setup, please see [here](/setup-guide/setup-supabase.html).

## Common Setup

- Clone the repository:

```bash
git clone https://github.com/raicdev/deni-ai.git
cd deni-ai
```

- Install dependencies:

```bash
pnpm install
```

## Local Setup

- Set up environment variables (optional):

```bash
cd apps/www

cp .env.example .env.local
```

> [!NOTE]
> If you want to use authentication and conversation synchronization features, edit the `.env.local` file and enter the necessary information. For details, refer to the [Supabase Setup (Optional)](#supabase-setup-optional) section. (Or, implement your own authentication and conversation synchronization features.)

- Start the development server:

```bash
pnpm dev
```

## Deploy to Vercel

To deploy to Vercel, follow the steps below.

### Prerequisites

- Vercel account
- New Vercel project
- Vercel CLI installed and configured

### Steps

- Set up environment variables (optional):

> [!NOTE]
> If you want to use authentication and conversation synchronization features, edit Vercel's environment variables file and enter the necessary information. For details, refer to the [Supabase Setup (Optional)](#supabase-setup-optional) section. (Or, implement your own authentication and conversation synchronization features.)

- Deploy to Vercel:

```bash
vercel
```