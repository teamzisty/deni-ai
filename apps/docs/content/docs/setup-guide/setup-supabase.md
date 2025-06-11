---
title: Setting up Supabase
description: This page explains how to set up Supabase.
category: docs
---

## 1. Create a Supabase project

For instructions on how to create one, please refer to the [Supabase Docs](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs).

## 2. Edit .env

Edit your .env file as follows:

```properties [.env]
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
NEXT_PUBLIC_SUPABASE_URL=<PROJECT_URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>
```

- You can get the Project URL and Anon key from the [Supabase Docs](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs).
- You can get the `service_role` key by accessing [API Keys](https://supabase.com/dashboard/project/_/settings/api-keys) and selecting your project.

## 3. Create tables in the SQL Editor

Create your tables in the Supabase SQL Editor.

Use the `supabase/schema.sql` file from your project to create the tables.

## Finally

Good job! Supabase setup is now complete.

Please return to the instance creation page and continue with the setup.
