<template>
  <div class="recent-posts">
    <h2 class="recent-posts-title">{{ title }}</h2>
    <div class="recent-posts-list">
      <div v-for="post in limitedPosts" :key="post.url" class="recent-post-item">
        <div class="post-meta">
          <time :datetime="post.date">{{ formatDate(post.date) }}</time>
        </div>
        <h3 class="post-title">
          <a :href="post.url">{{ post.title }}</a>
        </h3>
        <div v-if="post.tags && post.tags.length" class="post-tags">
          <a 
            v-for="tag in post.tags" 
            :key="tag" 
            :href="`${blogPath}/tags#${tag}`" 
            class="post-tag"
          >{{ tag }}</a>
        </div>
      </div>
    </div>
    <div class="view-all">
      <a :href="blogPath" class="view-all-link">{{ viewAllText }} →</a>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  posts: {
    type: Array,
    required: true
  },
  limit: {
    type: Number,
    default: 3
  },
  title: {
    type: String,
    default: 'Recent Posts'
  },
  viewAllText: {
    type: String,
    default: 'View all posts'
  },
  blogPath: {
    type: String,
    default: '/blog/'
  }
})

const limitedPosts = computed(() => {
  return props.posts.slice(0, props.limit)
})

function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.recent-posts {
  margin: 3rem 0;
  max-width: 100%;
}

.recent-posts-title {
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.recent-posts-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.recent-post-item {
  padding: 1.25rem;
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft);
  transition: transform 0.2s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.recent-post-item:hover {
  transform: translateY(-4px);
}

.post-meta {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  margin-bottom: 0.5rem;
}

.post-title {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  line-height: 1.3;
}

.post-title a {
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: color 0.2s;
}

.post-title a:hover {
  color: var(--vp-c-brand);
}

.post-tags {
  margin-top: auto;
  padding-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.post-tag {
  font-size: 0.75rem;
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-dark);
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  text-decoration: none;
  transition: background-color 0.2s, color 0.2s;
}

.post-tag:hover {
  background-color: var(--vp-c-brand);
  color: white;
}

.view-all {
  margin-top: 1.5rem;
  text-align: right;
}

.view-all-link {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--vp-c-brand);
  text-decoration: none;
  transition: color 0.2s;
}

.view-all-link:hover {
  color: var(--vp-c-brand-dark);
}

@media (max-width: 768px) {
  .recent-posts-list {
    grid-template-columns: 1fr;
  }
}
</style>
