---
title: Supabase の設定
description: このページでは、Supabase を設定する方法についてを説明しています。
category: docs
---

## 1. Supabase プロジェクトを作成する

作成方法については、[Supabase Docs](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs) をご覧ください。

## 2. .env を編集する

次のような方式で .env ファイルを編集してください。

```properties [.env]
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
NEXT_PUBLIC_SUPABASE_URL=<PROJECT_URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>
```

- [Supabase Docs](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs) から Project URL と Anon key を取得できます。
- [API Keys](https://supabase.com/dashboard/project/_/settings/api-keys) にアクセスし、プロジェクトを選択すると、`service_role` key を取得できます。

## 3. SQL Editor でテーブルを作成する

Supabase の SQL Editor でテーブルを作成してください。

プロジェクトの、`supabase/schema.sql` を利用してテーブルを作成してください。

## 最後に

お疲れ様です！これで Supabase の設定は完了です。

インスタンスの作成ページへ戻り、セットアップを進めてください。
