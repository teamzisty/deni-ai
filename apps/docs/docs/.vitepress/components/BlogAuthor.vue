<template>
  <div class="blog-author">
    <img v-if="avatarUrl" :src="avatarUrl" alt="" class="blog-author-avatar" />
    <div class="blog-author-info">
      <div class="blog-author-name">{{ name }}</div>
      <div v-if="title" class="blog-author-title">{{ title }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  name: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  avatarUrl: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.blog-author {
  display: flex;
  align-items: center;
  margin: 2rem 0;
  padding: 1rem;
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft);
}

.blog-author-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 1rem;
}

.blog-author-name {
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--vp-c-text-1);
}

.blog-author-title {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  margin-top: 0.25rem;
}
</style>
