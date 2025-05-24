import { createContentLoader } from 'vitepress'

export default createContentLoader(['blog/posts/*.md', 'blog/posts/*/index.md'], {
  excerpt: true,
  transform(raw) {    
    return raw
      .map(({ url, frontmatter, excerpt, filePath }) => {
        // Extract date from the filename (pattern: YYYY-MM-DD-*)
        let date = frontmatter.date
        
        if (!date && filePath) {
          // This regex extracts date from paths like blog/posts/2025-03-28-deni-ai-v2/index.md
          // or blog/posts/2025-04-04-deni-ai-v2.2.md
          const match = filePath.match(/(\d{4}-\d{2}-\d{2})/)
          if (match && match[1]) {
            date = match[1]
          }
        }
        
        // Process tags - ensure they are always an array
        let tags = frontmatter.tags || []
        if (typeof tags === 'string') {
          tags = [tags]
        } else if (!Array.isArray(tags)) {
          tags = []
        }
        
        return {
          title: frontmatter.title,
          url,
          excerpt,
          description: frontmatter.description,
          date,
          tags,
          author: frontmatter.author,
          filePath // Include for debugging
        }
      })
      .sort((a, b) => {
        if (!a.date && !b.date) return 0
        if (!a.date) return 1
        if (!b.date) return -1
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })
  }
})
