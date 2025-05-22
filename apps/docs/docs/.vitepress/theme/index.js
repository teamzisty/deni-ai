import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import BlogPostList from '../components/BlogPostList.vue'
import RecentPosts from '../components/RecentPosts.vue'
import BlogAuthor from '../components/BlogAuthor.vue'
import BlogDate from '../components/BlogDate.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    // Register custom global components
    app.component('BlogPostList', BlogPostList)
    app.component('RecentPosts', RecentPosts)
    app.component('BlogAuthor', BlogAuthor)
    app.component('BlogDate', BlogDate)
  }
}
