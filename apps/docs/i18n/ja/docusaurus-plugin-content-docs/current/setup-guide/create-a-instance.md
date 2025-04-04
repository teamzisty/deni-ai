---
sidebar_position: 1
---

# 自分でインスタンスを作成する

このページでは、自分でインスタンスを作成する方法を説明します。

## 前提条件

- Node.js (v18.18.0) 以降
- Bun (v1.2.7) 以降
- (オプション) Firebase プロジェクトの設定 (Firebase の設定については、以下の「Firebase の設定」を参照してください)
- (オプション) Brave Search API キー (検索に使用)
- (オプション) Uploadthing トークン (画像のアップロードに使用)

### Firebase の設定 (オプション)

1. Firebase プロジェクトを作成します。
2. Firebase Authentication と Firestore を有効にします。
3. `.env` ファイルに Firebase SDK を設定します。
4. (オプション) Firestore に `deni-ai-conversation` コレクションを作成します。

## セットアップ (共通)

- リポジトリをクローンする:

```bash
git clone https://github.com/raicdev/deni-ai.git
cd deni-ai
```

- 依存関係をインストールする:

```bash
bun install
```

## セットアップ (ローカル)

- 環境変数を設定する (オプション):

```bash
cd apps/www

cp .env.example .env.local
```

:::tip

認証と会話の同期機能を使用する場合は、`.env.local` ファイルを編集し、必要な情報を入力してください。詳細については、[Firebase の設定](#firebase-configuration)のセクションを参照してください。(または、独自の認証と会話の同期機能を実装してください)

:::

- 開発サーバーを起動する:

```bash
bun dev
```

## Vercel へデプロイ

Vercel にデプロイするには、以下の手順に従ってください。

### 前提条件

- Vercel アカウント
- 新しい Vercel プロジェクト
- Vercel CLI のインストールと設定

### 手順

- 環境変数を設定する (オプション):

:::tip

認証と会話の同期機能を使用する場合は、Vercel の 環境変数 ファイルを編集し、必要な情報を入力してください。詳細については、[Firebase の設定](#firebase-configuration)のセクションを参照してください。(または、独自の認証と会話の同期機能を実装してください)

:::

- Vercel へデプロイする:

```bash
vercel