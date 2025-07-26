---
title: 言語の追加と改善
description: このページでは、Deni AI へ翻訳 (多言語化) 関連の貢献をするための方法を説明します。
category: docs
---

## 言語の追加

- `apps/www/messages` ディレクトリにあなたの言語コードのjsonを作成します。 (例: `cn.json`, `en.json`)

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

- `apps/www/[locale]/layout.tsx` ファイルを編集して、言語を追加します。

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
        en: "/en", // ここに言語を追加
        ja: "/ja",
      },
    },
  };
}
```

- `apps/www/[locale]/(chat)/settings/page.tsx` ファイルを編集して、言語を追加します。

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

  {/* ここに言語を追加 */}

  <DropdownMenuItem
    onClick={() => {
      // ...
    }}
  >
    {t("settings.english")} {language === "en" && <Check className="ml-auto" />}
  </DropdownMenuItem>
</DropdownMenuContent>;
```

## 言語のメッセージを変更

- `apps/www/messages` ディレクトリにあるあなたの変更したい言語のjsonを編集します。 (例: `cn.json`, `en.json`)

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
