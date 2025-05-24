---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Deni AI Docs"
  text: "A documentation and blog of Deni AI."
  tagline: Powerful, customizable AI conversations
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/raicdev/deni-ai

features:
  - title: Fast
    details: Latest technology for fast responses
  - title: Safe
    details: Privacy-focused design for safe usage
  - title: Open Source
    details: Fully open source and available to everyone
---

<script setup>
import { data as posts } from '/blog/posts.data.js'
</script>

<RecentPosts :posts="posts" title="Latest Updates" view-all-text="View all blog posts" />

