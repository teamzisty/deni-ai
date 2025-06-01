---
title: "自分でインスタンスを作成する"
description: "このページでは、自分でインスタンスを作成する方法を説明します。"
category: "docs"
---

## 前提条件

- Node.js (v18.18.0) 以降
- 最新バージョンの pnpm
- (オプション) Supabase プロジェクトの設定 (Supabase の設定については、以下の「Supabase の設定」を参照してください)
- (オプション) Brave Search API キー (検索に使用)
- (オプション) Uploadthing トークン (画像のアップロードに使用)

### Supabase の設定 (オプション)

Supabase の設定に関しては、[こちら](/ja/setup-guide/setup-supabase.html) をご覧ください。

## セットアップ (共通)

- リポジトリをクローンする:

```bash
git clone https://github.com/raicdev/deni-ai.git
cd deni-ai
```

- 依存関係をインストールする:

```bash
pnpm install
```

## セットアップ (ローカル)

- 環境変数を設定する (オプション):

```bash
cd apps/www

cp .env.example .env.local
```

> [!NOTE]
> 認証と会話の同期機能を使用する場合は、`.env.local` ファイルを編集し、必要な情報を入力してください。詳細については、[Supabase の設定](#Supabase-の設定-オプション)のセクションを参照してください。(または、独自の認証と会話の同期機能を実装してください)

- 開発サーバーを起動する:

```bash
pnpm dev
```

## Vercel へデプロイ

Vercel にデプロイするには、以下の手順に従ってください。

### 前提条件

- Vercel アカウント
- 新しい Vercel プロジェクト
- Vercel CLI のインストールと設定

### 手順

- 環境変数を設定する (オプション):

> [!NOTE]
> 認証と会話の同期機能を使用する場合は、Vercel の 環境変数 ファイルを編集し、必要な情報を入力してください。詳細については、[Supabase の設定](#Supabase-の設定-オプション)のセクションを参照してください。(または、独自の認証と会話の同期機能を実装してください)

- Vercel へデプロイする:

```bash
vercel