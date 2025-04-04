---
sidebar_position: 1
---

# Customizing Your Instance

This page explains the basic customization methods for your created instance.

## Prerequisites

- Completed setup of a Deni AI instance

## Environment Variables and Available Features

You can enhance your instance's functionality by modifying environment variables.

- To use Deni AI's standard authentication and conversation sync, all Firebase-related environment variables are required.
- To use Deni AI's standard search feature, a Brave Search API key is required.
- To use Deni AI's standard image upload feature, an UploadThing token is required.

| Environment Variable | Description |
| ------------------------------------------ | ------------------------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase authentication domain. |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID. |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket. |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID. |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Key for server-side Firebase usage. |
| `BRAVE_SEARCH_API_KEY` | Brave Search API key. |
| `UPLOADTHING_TOKEN` | UploadThing token. |

## Changing the Brand Name

:::tip

This project is released under the MIT license. While you are free to change the brand name, credit attribution is required.

:::

Currently, there is no dedicated method to change the brand name, but you can use your editor's replace function to change it.

We plan to improve the instance to make it easier to customize in the future.

## Creating Languages

This section explains how to create languages.

- Create a json file with your language code in the `apps/www/messages` directory. (e.g., `cn.json`, `en.json`)

```json title="apps/www/messages/en.json"
{
  "layout": {
    "title": "Deni AI",
    "description": "Deni AI is a completely free chat app that uses AI models such as o1 and Claude 3.5 Sonnet.",
    "locale": "en_US"
  }
  // .....
}
```

- Edit the `apps/www/[locale]/layout.tsx` file to add the language.

```tsx title="apps/www/en/layout.tsx"
import React from "react";
// ...

export async function generateMetadata() {
  const t = await getTranslations();

  return {
    // ...
    alternates: {
      canonical: "/",
      languages: {
        en: "/en", // Add languages here
        ja: "/ja",
      },
    },
  };
}
```

- Edit the `apps/www/[locale]/(chat)/settings/page.tsx` file to add the language.

```tsx title="apps/www/[locale]/(chat)/settings/page.tsx"
import React from "react";
// ...
// 210 lines ~
<DropdownMenuContent align="end">
  <DropdownMenuItem
    onClick={() => {
      // ...
    }}
  >
    {t("settings.japanese")}{" "}
    {language === "ja" && <Check className="ml-auto" />}
  </DropdownMenuItem>

  {/* Add languages here */}

  <DropdownMenuItem
    onClick={() => {
      // ...
    }}
  >
    {t("settings.english")} {language === "en" && <Check className="ml-auto" />}
  </DropdownMenuItem>
</DropdownMenuContent>;
```

## Changing API Endpoints

Deni AI uses its own `ai-sdk` providers:

- `voids-oai-provider`: Provider for using OpenAI models on voids.top
- `voids-ap-provider`: Provider for using Anthropic models on voids.top

> For voids.top API documentation, please refer to [here](https://voids.top/docs).

If you want to use your own API, it is recommended to edit the `apps/www/app/api/chat/route.ts` file and change the `ai-sdk` provider.

Even when using `voids-oai-provider` and `voids-ap-provider`, you can change the `baseUrl`, but the message format for Anthropic AI models will not be available.

## Adding Your Features

Since it's open source, you can add your own features.

Change the theme, modify system prompts, add some fun elements - create your own Deni AI!