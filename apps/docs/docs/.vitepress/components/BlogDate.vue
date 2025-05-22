<template>
  <time :datetime="isoDate" class="blog-date" :class="{ 'blog-date-large': large }">
    {{ formattedDate }}
  </time>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  date: {
    type: [String, Date],
    required: true
  },
  large: {
    type: Boolean,
    default: false
  },
  locale: {
    type: String,
    default: undefined
  },
  format: {
    type: Object,
    default: () => ({ 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }
})

const isoDate = computed(() => {
  if (!props.date) return ''
  const date = new Date(props.date)
  return date.toISOString()
})

const formattedDate = computed(() => {
  if (!props.date) return ''
  const date = new Date(props.date)
  return date.toLocaleDateString(props.locale, props.format)
})
</script>

<style scoped>
.blog-date {
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
}

.blog-date-large {
  font-size: 1.1rem;
  font-weight: 500;
}
</style>
