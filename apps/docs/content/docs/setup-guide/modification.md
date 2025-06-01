---
title: Customizing Your Instance
description: This page explains the basic customization methods for your created instance.
category: docs
---

## Prerequisites

-   Deni AI instance setup is complete.

## Environment Variables and Available Features

By changing environment variables, you can increase the functionality of your instance.

### Features Available with Supabase-related Environment Variables

-   Use of Deni AI standard authentication and conversation synchronization
-   Use of Deni AI Bots
-   Other Supabase-related features

### Features Available with Non-Supabase Environment Variables

-   Deni AI standard search function - Requires Brave Search API key.
-   Deni AI standard image upload function - Requires UploadThing token.

| Environment Variable Name          | Description                                 |
| ------------------------------------------ | ------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                 | Supabase URL.                               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`            | Supabase anonymous key.                     |
| `SUPABASE_SERVICE_ROLE_KEY`                | Supabase service role key.                  |
| `BRAVE_SEARCH_API_KEY`                     | Brave Search API key.                       |
| `UPLOADTHING_TOKEN`                        | UploadThing token.                          |

## Changing the Brand Name

> [!NOTE]
> This project is published under the MIT license. Therefore, you are free to change the brand name, but credit attribution is required.

Currently, there is no specific method to change the brand name, but you can change it using your editor's replace function or similar tools.

We plan to improve the instance to make customization easier in the future.

## Creating a Language

Please refer to Contribution -> Adding and Improving Languages.

## Changing API Endpoints

Deni AI uses its own `ai-sdk` providers.

-   `voids-oai-provider`: A provider that allows you to use OpenAI models with voids.top
-   `voids-ap-provider`: A provider that allows you to use Anthropic models with voids.top

> For voids.top API documentation, please refer to [here](https://voids.top/docs).

If you want to use your own API, it is recommended to edit the `apps/www/app/api/chat/route.ts` file and change the `ai-sdk` provider.

Even if you use `voids-oai-provider` and `voids-ap-provider`, you can change the `baseUrl`, but the messaging format for Anthropic AI models will not be available.

## Adding Your Features

Since it's open source, you can add your own features.

Change the theme, alter system prompts, or just have some fun. Create your own Deni AI!