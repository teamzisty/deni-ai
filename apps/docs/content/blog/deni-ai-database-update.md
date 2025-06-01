---
title: Information regarding Deni AI's database update
date: 2025-06-01
description: This document explains the information regarding Deni AI's database update.
author: rai
tags: [update]
---

## Brief Explanation

In Deni AI v4.1.0 (beta 3), the database for both the code and the official instance has been migrated to Supabase.

There are several reasons for this. Below is a list of reasons:

- To utilize features not available in Firebase (the old database)
- To improve the system's database read/write speed
- To enhance database security

## Impact of Changes

### For Regular Users

Due to the database migration, existing users will need to reset their passwords. You will need to manually reset your password from the login screen.

### For Users Creating New Instances

Please refer to the Docs. The latest installation instructions are provided there.

### For Users Operating Instances

If you are operating an instance, you will need to make several changes. Here are the steps to make those changes:

#### 0. Pull the new code from Git

```sh
git pull
```

If conflicts occur, please resolve them yourself.

#### 1. Create a Supabase project
> For instructions on how to create one, please see the [Supabase Docs](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs).

#### 2. Edit .env

Edit your .env file in the following format:

```properties [.env]
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
NEXT_PUBLIC_SUPABASE_URL=<PROJECT_URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>
```

> - You can get the Project URL and Anon key from the [Supabase Docs](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs).
> - Access [API Keys](https://supabase.com/dashboard/project/_/settings/api-keys) and select your project to get the `service_role` key.

#### 3. Create tables in the SQL Editor

Create tables in Supabase's SQL Editor.

Use `supabase/schema.sql` from your project to create the tables.

#### 4. Migrate data to Supabase

Please review the migration methods for [Firebase Auth](https://supabase.com/docs/guides/platform/migrating-to-supabase/firebase-auth) and [Firebase Firestore](https://supabase.com/docs/guides/platform/migrating-to-supabase/firestore-data) and migrate the data yourself.

::: info Note

We plan to provide a dedicated migration tool for Deni AI. Until the tool is ready, please import manually.

However, migration of custom data will not be supported.

:::

> - When migrating passwords from Firebase, Middleware to host Hash Parameters is required.
> - If password migration is not possible, you can use your account by requesting a password reset.

> - To export nested collections (such as `deni-ai-conversations`), you need to create a UID list and then read the data one by one.
> - You need to create a mapping between Firebase Auth UIDs and Supabase Auth UIDs, and put the Supabase Auth UID into `user_id`.

#### 5. (Optional) Replace custom logic

If you have added custom logic to save data to Firestore, please replace that part.

## Finally

We apologize for the downtime caused by the database change in Deni AI v4.1.0.

We appreciate your continued support for Deni AI.
