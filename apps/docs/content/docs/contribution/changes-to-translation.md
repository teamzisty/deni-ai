---
title: "Adding and Improving Languages"
description: "Learn how to contribute translations (multilingualization) to Deni AI"
category: "contribution"
---

## Adding a Language

- Create a json file with your language code in the `apps/www/messages` directory. (e.g. `cn.json`, `en.json`)

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
        en: "/en", // Add language here
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

  {/* Add language here */}

  <DropdownMenuItem
    onClick={() => {
      // ...
    }}
  >
    {t("settings.english")} {language === "en" && <Check className="ml-auto" />}
  </DropdownMenuItem>
</DropdownMenuContent>;
```

## Modifying Language Messages

- Edit the json file of the language you want to change in the `apps/www/messages` directory. (e.g. `cn.json`, `en.json`)

```json title="apps/www/messages/en.json"
{
  "layout": {
    "title": "AI Playground", // Replace these
    "description": "Deni AI is a completely free chat app that uses AI models such as o1 and Claude 3.5 Sonnet.",
    "locale": "en_US"
  }
  // .....
}
```