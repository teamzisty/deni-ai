---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Deni AI ドキュメント"
  text: "Deni AIのドキュメントとブログ"
  tagline: 強力でカスタマイズ可能なAI会話
  actions:
    - theme: brand
      text: はじめに
      link: /ja/getting-started
    - theme: alt
      text: GitHubで見る
      link: https://github.com/raicdev/deni-ai

features:
  - title: 高速
    details: 最新の技術を使用することで、高速な応答を実現
  - title: 安全
    details: プライバシーを重視した設計で、安全に使用可能
  - title: オープンソース
    details: 完全なオープンソースで、誰でも利用可能
---

<script setup>
import { data as posts } from './blog/posts.data.js'
</script>

<RecentPosts :posts="posts" title="最新の更新" view-all-text="すべてのブログ記事を見る" blog-path="/ja/blog/" />
