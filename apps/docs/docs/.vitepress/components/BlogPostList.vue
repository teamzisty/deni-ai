<template>
  <div class="blog-post-list">
    <div v-for="post in posts" :key="post.url" class="blog-post">
      <h2 class="blog-post-title">
        <a :href="post.url">{{ post.title }}</a>
      </h2>

      <div class="blog-post-meta">
        <span v-if="post.type === 'update'" class="blog-post-update-badge">update</span>
        <span v-if="post.tags && post.tags.length" class="blog-post-tags">
          <a
            v-for="tag in post.tags"
            :key="tag"
            :href="`/blog/tags#${tag}`"
            class="blog-post-tag"
            >{{ tag }}</a
          >
        </span>
      </div>

      <a :href="post.url" class="blog-post-read-more">Read more →</a>
    </div>
  </div>
</template>

<script setup>
defineProps({
  posts: {
    type: Array,
    required: true,
  },
});

function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
</script>

<style scoped>
.blog-post-list {
  margin-top: 2rem;
}

.blog-post {
  margin-bottom: 3rem;
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 2rem;
}

.blog-post:last-child {
  border-bottom: none;
}

.blog-post-title {
  margin-top: 0;
  margin-bottom: 0;
}

.blog-post-title a {
  color: var(--vp-c-text-1);
  text-decoration: none;
  font-weight: bold;
  transition: color 0.2s ease;
}

.blog-post-title a:hover {
  color: var(--vp-c-brand);
}

.blog-post-meta {
  color: var(--vp-c-text-2);
  font-size: 1rem;
  margin-bottom: 1rem;
}
.blog-post-author {
  margin-right: 0.5rem;
}

.blog-post-update-badge {
  background-color: var(--vp-c-gray-dark-3);
  color: var(--vp-c-gray-light-5);
  border-radius: 4px;
  padding: 0.1rem 0.5rem;
  font-size: 0.8rem;
  margin-right: 0.5rem;
  display: inline-block;
}

.blog-post-tags {
  margin-left: 0.5rem;
}

.blog-post-tag {
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-dark);
  border-radius: 4px;
  padding: 0.1rem 0.5rem;
  font-size: 0.8rem;
  margin-right: 0.5rem;
  display: inline-block;
  margin-top: 0.25rem;
  text-decoration: none;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.blog-post-tag:hover {
  background-color: var(--vp-c-brand);
  color: white;
}

.blog-post-excerpt {
  margin-bottom: 1rem;
  line-height: 1.6;
  color: var(--vp-c-text-1);
}

.blog-post-read-more {
  font-weight: 500;
  color: var(--vp-c-brand);
  text-decoration: none;
  display: inline-block;
  transition: color 0.2s ease;
}

.blog-post-read-more:hover {
  color: var(--vp-c-brand-dark);
}
</style>
