---
title: Deni AI v2.2 のリリース
date: 2025-04-04
description: バージョン 2.2 の新しい機能やバグ修正、改善点をご紹介します。
author: rai
tags: [update]
---

## ローカライズ (英語はβ版)

ベータ版ですが、ローカライズを実施しました。まだローカライズできていない部分もありますが、アップデートなどで改善していく予定です。

## とても高いモデルを追加

GPT 4.5 Preview、Claude 3.7 Sonnet (+ Extended Thinking)、o1、o3-mini (改良版) を追加しました。

| モデル名          | 公式 API 料金 (USD, 入力/出力) |
| ----------------- | ------------------------------ |
| GPT-4.5 Preview   | $75 / $150                     |
| Claude 3.7 Sonnet | $3 / $15                       |
| o1                | $15 / $60                      |
| o3-mini           | $1.1 / $4.4                    |

<small>あと、Gemini 2.0 Flash が再び動くようになりました！</small>

## モデル設定の改善

モデル設定が不便というフィードバックをいただいたので、モデル設定を改善しました。

- モデルフィルターを追加 (モデルプロバイダー、機能)
- モデル設定の機能に色を追加

## バグ修正

このバージョンでは、1 つのバグを修正しました。

- モデル: Gemini 2.0 Flash が動かない問題を修正

## 機能の変更

このバージョンでは、5 つの機能変更が行われました。

- ローカライズの追加
- モデル設定: フィルターを追加
- モデル設定: 機能に色を追加
- アカウント管理メニュー: バージョン情報を追加
- モデル: GPT-4.5, Claude 3.7 Sonnet, o1, o3-mini を追加

## システムの変更

このバージョンでは、2 つのシステム変更が行われました。

- Turborepo を使用したプロジェクト構造に変更
- Claude で Extended Thinking を使用するようにするために、`voids-oai-provider` と `voids-ap-provider` を追加

### システム変更のパッチ

このパッチでは、1 つのシステム変更が行われました。

<small>このパッチについての詳細は、[GitHub の Pull requests](https://github.com/raicdev/deni-ai/pull/2) をご覧ください。</small>

- Firebase の設定ファイルを、`apps/www` 内から `packages/firebase-config` に移動

パッチノートに含まれていないすべての変更点は、[GitHub の Pull requests](https://github.com/raicdev/deni-ai/pull/1) をご覧ください。

> [!NOTE]
> Deni AI のレポジトリは、https://github.com/raicdev/deni-ai に移動しました。今後はこちらのレポジトリでコミットされます。
