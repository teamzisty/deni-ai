---
title: Deni AI のデータベース更新に関する情報
date: 2025-06-01
description: Deni AI のデータベース更新に関する情報についてを説明します。
author: rai
tags: [update]
---

## 簡単な説明

Deni AI v4.1.0 (beta 3) で、コード及び公式インスタンスのデータベースを Supabase へ移行しました。

これには、いくつかの原因があります。以下は原因の一覧です。

- Firebase (旧データベース) では利用できない機能を利用するため
- システムのデータベース読み取り・読み込み速度の向上
- データベースセキュリティの向上

## 変更の影響

### 通常ユーザー向け

データベースの移行により、既存ユーザーのパスワードリセットが必要になりました。ログイン画面から手動でパスワードをリセットしていただく必要があります。

### 新しくインスタンスを作成するユーザー向け

Docs をご覧ください。最新のインストール方法が記載されています。

### インスタンスを運営しているユーザー向け

インスタンスを運営している場合、多くの変更を加える必要があります。以下は、変更するための手段です。

#### 0. Git から新しいコードを Pull する

```sh
git pull
```

Conflict が発生した場合は、自分で解決してください。

#### 1. Supabase プロジェクトを作成する

作成方法については、[Supabase Docs](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs) をご覧ください。

#### 2. .env を編集する

次のような方式で .env ファイルを編集してください。

```properties [.env]
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
NEXT_PUBLIC_SUPABASE_URL=<PROJECT_URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>
```

- [Supabase Docs](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs) から Project URL と Anon key を取得できます。
- [API Keys](https://supabase.com/dashboard/project/_/settings/api-keys) にアクセスし、プロジェクトを選択すると、`service_role` key を取得できます。

#### 3. SQL Editor でテーブルを作成する

Supabase の SQL Editor でテーブルを作成してください。

プロジェクトの、`supabase/schema.sql` を利用してテーブルを作成してください。

#### 4. Supabase へデータを移行する

[Firebase Auth](https://supabase.com/docs/guides/platform/migrating-to-supabase/firebase-auth) の移行方法と、[Firebase Firestore](https://supabase.com/docs/guides/platform/migrating-to-supabase/firestore-data) の移行方法を確認して、自分で移行してください。

> [!NOTE]
> Deni AI 専用の移行ツールを用意する予定です。ツールが完成するまでは、手動でインポートしてください。
>
> ただし、カスタムデータの移行はサポートされません。

> [!NOTE]
>
> - Firebase からパスワードを移行する場合、Hash Parameters をホストする Middleware が必要です。
> - パスワード移行ができない場合は、パスワードリセットを要求してアカウントを使用することができます。

> [!NOTE]
>
> - ネストされたコレクション (`deni-ai-conversations` など) をエクスポートするには、UID リストを作成し、それから一つずつデータを読み取る必要があります。
> - Firebase Auth の UID と Supabase Auth の UID のマッピングを作成し、`user_id` に Supabase Auth の UID を入れる必要があります。

#### 5. (オプション) カスタムロジックを置き換える

自分で、Firestore にカスタムデータを保存するロジックを追加している場合は、その部分を置き換えてください。

## 最後に

Deni AI v4.1.0 のデータベース変更により、ダウンタイムが発生してしまい申し訳ございません。

これからも、Deni AI を何卒宜しくお願い致します。
