---
sidebar_position: 1
---

# レポジトリをセットアップ

このページでは、Deni AI へ貢献するためにレポジトリをセットアップする方法を説明します。

## このレポジトリの構造

このレポジトリはmonorepo構造になっています。

- [bun](https://bun.sh/) と [Workspaces](https://bun.sh/docs/install/workspaces) 機能を開発のために利用しています。
- [Turborepo](https://turbo.build/repo/) をビルドシステムに利用しています。
- [Next.js](https://nextjs.org/) をメインアプリ (apps/www) のフレームワークに利用しています。
- [Docusaurus](https://docusaurus.io/) をドキュメント (apps/docs) のフレームワークに利用しています。

このレポジトリはこのような構造になっています。

```
├── apps
│   ├── docs                # Documentation
│   └── www                 # Main Next.js web application
└── packages
    ├── eslint-config       # Shared ESLint Configuration
    ├── firebase-config     # Firebase configuration
    ├── typescript-config   # Shared TypeScript Configuration
    ├── ui                  # Shared UI component library
    ├── voids-ap-provider   # Anthropic provider for voids.top
    └── voids-oai-provider  # OpenAI provider for voids.top
```

## セットアップ

### レポジトリをフォーク

GitHub レポジトリのページにアクセスして、右上の「Fork」ボタンをクリックしてフォークします。

### ローカルにクローン

```bash
git clone https://github.com/<your-username>/deni-ai.git
```

### プロジェクトにディレクトリを移動

```bash
cd deni-ai
```

### 新しいブランチを作成

```bash
git checkout -b <your-branch-name>
```

### 依存関係をインストール

```bash
bun install
```

### ローカルで実行

Deni AI のアプリケーションのみを実行するには、以下のコマンドを使用してください。

```bash
bun --filter=www dev
```

### コミットの条件

Pull request を作成する前に、以下の条件を満たしていることを確認してください。

- ビルドが問題なく、どの環境でも動作すること
- コミットメッセージを英語で、以下のルールに沿って記述すること

#### コミットメッセージのルール

`category(scope): message` の方式を使用して、コミットメッセージを記述します。カテゴリーは以下のいずれかを使用します。

- `feat`: 新しい機能の追加
- `fix`: バグの修正
- `docs`: ドキュメントの更新
- `style`: コードのスタイルの変更
- `refactor`: コードのリファクタリング
- `ci`: CI の設定の変更
- `chore`: ビルドプロセスや補助ツールの変更

> 例: `fix(www): Fixes a bug in the login page`