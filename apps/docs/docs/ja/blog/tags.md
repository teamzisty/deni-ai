---
layout: doc
title: ブログのタグ
---

# ブログのタグ

<script setup>
import { data as posts } from './posts.data.js'
import { ref, computed, onMounted } from 'vue'

// Debug helper - check if posts data is loaded
onMounted(() => {
  console.log('Posts loaded:', posts.length)
  console.log('Posts with tags:', posts.filter(p => p.tags && p.tags.length > 0).length)
})

// Extract all unique tags from posts
const allTags = computed(() => {
  const tags = new Set()
  if (posts && posts.length) {
    posts.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          // Handle both string tags and Docusaurus-style tag objects
          const tagValue = typeof tag === 'object' && tag.label ? tag.label : tag
          if (tagValue) tags.add(tagValue)
        })
      }
    })
  }
  return Array.from(tags).sort()
})

// Group posts by tag
const postsByTag = computed(() => {
  const result = {}
  allTags.value.forEach(tag => {
    result[tag] = posts.filter(post => {
      if (!post.tags || !Array.isArray(post.tags)) return false
      
      return post.tags.some(postTag => {
        // Handle both string tags and Docusaurus-style tag objects
        if (typeof postTag === 'object' && postTag.label) {
          return postTag.label === tag
        }
        return postTag === tag
      })
    })
  })
  return result
})

// Count posts for each tag
const getPostCount = (tag) => {
  return postsByTag.value[tag] ? postsByTag.value[tag].length : 0
}

// Format date in locale-aware format
const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short', 
    day: 'numeric'
  })
}

// Function to generate tag badge colors based on tag name
// This creates a unique but consistent color for each tag
const getTagColor = (tag) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate hue value between 0 and 360
  const hue = hash % 360;
  // Use a consistent saturation and lightness
  return `hsl(${hue}, 70%, 65%)`;
}
</script>

<div v-if="allTags && allTags.length > 0">
  <div class="tags-overview">
    <div class="tag-badges">
      <a 
        v-for="tag in allTags" 
        :key="tag" 
        :href="`#${tag}`" 
        class="tag-badge"
        :style="{ backgroundColor: getTagColor(tag) }"
      >
        {{ tag }} ({{ getPostCount(tag) }})
      </a>
    </div>
  </div>

  <div class="tags-container">
<div v-for="tag in allTags" :key="tag" class="tag-section">
  <h2 :id="tag" class="tag-heading">
    <span 
      class="tag-badge"
      :style="{ backgroundColor: getTagColor(tag) || '#ccc' }"
    >{{ tag }}</span>
    <span class="tag-count">
      {{ getPostCount(tag) || 0 }} post{{ getPostCount(tag) !== 1 ? 's' : '' }}
    </span>
  </h2>

  <ul class="post-list" v-if="postsByTag[tag]">
    <li v-for="(post, index) in postsByTag[tag]" :key="post.url || index" class="post-item">
      <div class="post-meta">
        <span class="post-date">{{ formatDate(post.date) }}</span>
      </div>
      <a :href="post.url" class="post-title">{{ post.title }}</a>
    </li>
  </ul>
</div>
</div>
</div>
<div v-else class="no-tags-message">
  <p>No blog posts with tags found. Tags will appear here once blog posts are properly tagged.</p>
</div>

<style>
/* Tags overview section */
.tags-overview {
  margin: 2rem 0;
  padding: 1.5rem;
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft);
}

.tag-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-badge {
  display: inline-block;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--vp-c-white);
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.tag-badge:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
}

/* Tag sections */
.tags-container {
  margin-top: 3rem;
}

.tag-section {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.tag-section:last-child {
  border-bottom: none;
}

.tag-heading {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  position: relative;
}

.tag-heading::before {
  content: "#";
  position: absolute;
  left: -1.5rem;
  color: var(--vp-c-brand);
  opacity: 0.5;
}

.tag-count {
  margin-left: 1rem;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  font-weight: normal;
}

/* Post list */
.post-list {
  padding-left: 0;
  list-style: none;
}

.post-item {
  margin-bottom: 1.5rem;
  padding: 1rem;
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft);
  transition: transform 0.2s ease;
}

.post-item:hover {
  transform: translateY(-2px);
}

.post-meta {
  margin-bottom: 0.5rem;
}

.post-date {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}

.post-title {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.post-title:hover {
  color: var(--vp-c-brand);
}

.post-excerpt {
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* No tags message */
.no-tags-message {
  margin: 3rem 0;
  padding: 2rem;
  text-align: center;
  background-color: var(--vp-c-bg-soft);
  border-radius: 8px;
  color: var(--vp-c-text-2);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .tag-badges {
    gap: 0.4rem;
  }
  
  .tag-badge {
    padding: 0.2rem 0.6rem;
    font-size: 0.8rem;
  }
  
  .post-item {
    padding: 0.8rem;
  }
}
</style>
