---
sidebar_position: 1
---

# インスタンスのカスタマイズ

このページでは、作成したインスタンスの基本カスタマイズ方法を説明します。

## 前提条件

- Deni AI インスタンスのセットアップが完了していること

## 環境変数と使用できる機能

環境変数を変更することで、インスタンスの機能を増やすことができます。

- Deni AI 標準の認証、会話の同期を使用するには、Firebase 関連の環境変数がすべて必要です。
- Deni AI 標準の検索機能を使用するには、Brave Search API キーが必要です。
- Deni AI 標準の画像アップロード機能を使用するには、UploadThing トークンが必要です。

| 環境変数名 | 説明 |
| ------------------------------------------ | ------------------------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase の API キー。 |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase の認証ドメイン。 |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase のプロジェクト ID。 |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase のストレージバケット。 |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase のメッセージング送信者 ID。 |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase をサーバーから使用するためのキー。 |
| `BRAVE_SERACH_API_KEY` | Brave Search API キー。 |
| `UPLOADTHING_TOKEN` | UploadThing のトークン。 |

## ブランド名の変更

:::tip

このプロジェクトは、MIT ライセンスの下で公開されています。そのため、ブランド名を変更することは自由ですが、クレジット表記が必要です。

:::

現在、ブランド名を変更する方法はありませんが、あなたのエディタの置き換え機能などを使用して、ブランド名を変更することができます。

今後、インスタンスがより簡単にカスタマイズできるように改善する予定です。

## 言語の作成

貢献 -> 言語の追加と改善 を参照してください。

## API エンドポイントの変更

Deni AI では独自の `ai-sdk` プロバイダーを使用しています。

- `voids-oai-provider`: voids.top で OpenAI モデルを使えるようにするプロバイダー
- `voids-ap-provider`: voids.top で Anthropic モデルを使えるようにするプロバイダー

> voids.top の API ドキュメンテーションに関しては、[こちら](https://voids.top/docs) を参照してください。

あなたの API を使用する場合、`apps/www/app/api/chat/route.ts` ファイルを編集して、`ai-sdk` プロバイダーを変更することを推奨します。

`voids-oai-provider` と `voids-ap-provider` を使用する場合でも、`baseUrl` を変更することはできますが、Anthropic AI モデル向けのメッセージ方式は利用できません。

## あなたの機能の追加

オープンソースなので、あなたの機能を追加することができます。

テーマを変えたり、システムプロンプトを変えたり、ちょっとふざけたり。あなたのDeni AI を作成しましょう！