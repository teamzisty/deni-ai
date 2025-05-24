<template>
  <Layout>
    <template #doc-before>
      <div class="blog-post-header" v-if="isBlogPost">
        <h1
          class="blog-post-title"
          style="font-size: 1.5rem; font-weight: bold"
        >
          {{ frontmatter.title }}
        </h1>
        <div class="blog-post-meta">
          <BlogDate :date="frontmatter.date" large :locale="currentLocale" />
          <span v-if="frontmatter.author" class="blog-post-author">{{
            frontmatter.author
          }}</span>
        </div>
        <div v-if="frontmatter.tags?.length" class="blog-post-tags">
          <a
            v-for="tag in frontmatter.tags"
            :key="tag"
            :href="`${blogBasePath}/tags#${tag}`"
            class="blog-post-tag"
            >{{ tag }}</a
          >
        </div>
        <div v-if="frontmatter.description" class="blog-post-excerpt">
          {{ frontmatter.description }}
        </div>
      </div>
    </template>

    <template #doc-after>
      <div class="blog-post-footer" v-if="isBlogPost">
        <BlogAuthor v-if="frontmatter.author" :name="frontmatter.author" />

        <div class="blog-post-nav">
          <div v-if="prev" class="blog-post-prev">
            <span class="blog-post-nav-label">Previous Post</span>
            <a :href="prev.link">{{ prev.text }}</a>
          </div>
          <div v-if="next" class="blog-post-next">
            <span class="blog-post-nav-label">Next Post</span>
            <a :href="next.link">{{ next.text }}</a>
          </div>
        </div>
      </div>
    </template>
  </Layout>
</template>

<script setup>
import { computed } from "vue";
import DefaultTheme from "vitepress/theme";
import { useData, useRoute } from "vitepress";

const { Layout } = DefaultTheme;
const { frontmatter, lang, page, theme } = useData();
const route = useRoute();

// Check if current page is a blog post
const isBlogPost = computed(() => {
  return (
    route.path.includes("/blog/posts/") ||
    route.path.includes("/ja/blog/posts/")
  );
});

// Set blog base path based on locale
const blogBasePath = computed(() => {
  return lang.value === "ja" ? "/ja/blog" : "/blog";
});

// Set current locale
const currentLocale = computed(() => {
  return lang.value === "ja" ? "ja-JP" : undefined;
});

// TODO: Implement prev/next navigation between blog posts
const prev = computed(() => null);
const next = computed(() => null);
</script>

<style>
.blog-post-nav {
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
}

.blog-post-prev,
.blog-post-next {
  max-width: 45%;
}

.blog-post-tags {
  margin-bottom: 1rem;
}

.blog-post-nav-label {
  display: block;
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  margin-bottom: 0.25rem;
}
</style>
