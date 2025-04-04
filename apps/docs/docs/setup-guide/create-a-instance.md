---
sidebar_position: 1
---

# Creating Your Own Instance

This page explains how to create your own instance.

## Prerequisites

- Node.js (v18.18.0) or later
- Bun (v1.2.7) or later
- (Optional) Firebase project setup (See "Firebase Configuration" below for Firebase setup)
- (Optional) Brave Search API key (used for search)
- (Optional) Uploadthing token (used for image uploads)

### Firebase Configuration (Optional)

1. Create a Firebase project
2. Enable Firebase Authentication and Firestore
3. Set up Firebase SDK in your `.env` file
4. (Optional) Create a `deni-ai-conversation` collection in Firestore

## Setup (Common)

- Clone the repository:

```bash
git clone https://github.com/raicdev/deni-ai.git
cd deni-ai
```

- Install dependencies:

```bash
bun install
```

## Setup (Local)

- Set up environment variables (Optional):

```bash
cd apps/www

cp .env.example .env.local
```

:::tip

If you want to use authentication and conversation sync features, edit the `.env.local` file and enter the required information. See the [Firebase Configuration](#firebase-configuration-optional) section for details. (Or implement your own authentication and conversation sync)

:::

- Start the development server:

```bash
bun dev
```

## Deploy to Vercel

Follow these steps to deploy to Vercel.

### Prerequisites

- Vercel account
- New Vercel project
- Vercel CLI installed and configured

### Steps

- Set up environment variables (Optional):

:::tip

If you want to use authentication and conversation sync features, edit the environment variables file in Vercel and enter the required information. See the [Firebase Configuration](#firebase-configuration-optional) section for details. (Or implement your own authentication and conversation sync)

:::

- Deploy to Vercel:

```bash
vercel
