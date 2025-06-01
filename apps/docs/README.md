# Deni AI Documentation Site

A comprehensive documentation website for Deni AI built with Next.js 15, featuring blog functionality, version management, i18n support, and modern design.

## Features

- 📖 **Documentation**: Dynamic documentation pages with MDX support
- 📝 **Blog**: Full-featured blog with posts and categories
- 🌍 **Internationalization**: Multi-language support (English/Japanese)
- 🔍 **Search**: Fast client-side search across all content
- 🌙 **Dark Mode**: Built-in theme switching
- 📱 **Responsive**: Mobile-first responsive design
- ⚡ **Performance**: Optimized with Next.js 15 and Turbopack

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS 4 with Typography plugin
- **Content**: Markdown with frontmatter parsing
- **Icons**: Lucide React
- **Theme**: next-themes for dark/light mode
- **Package Manager**: pnpm

## Development

### Prerequisites

- Node.js 18+ 
- pnpm

### Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start development server:
   ```bash
   pnpm dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
pnpm build
pnpm start
```

## Content Structure

```
content/
├── blog/           # Blog posts (.md files)
├── docs/           # Documentation pages (.md files)
├── versions/       # Version information
└── ja/            # Japanese translations
```

### Blog Posts

Blog posts should be placed in `content/blog/` with frontmatter:

```markdown
---
title: "Post Title"
description: "Post description"
date: "2025-01-01"
author: "Author Name"
tags: ["tag1", "tag2"]
---

Your content here...
```

### Documentation Pages

Documentation pages should be placed in `content/docs/` with frontmatter:

```markdown
---
title: "Page Title"
description: "Page description"
order: 1
category: "Category"
date: "2025-01-01"
author: "Author Name"
---

Your content here...
```

## Key Components

- **Header**: Navigation with search, theme toggle, and locale selector
- **SearchDialog**: Full-text search across blog and docs
- **LocaleSelector**: Language switching component
- **RecentPosts**: Dynamic recent blog posts display
- **ThemeProvider**: Dark/light mode management

## API Routes

The site uses Next.js App Router with:
- Dynamic routes for blog posts: `/blog/[slug]`
- Dynamic routes for docs: `/docs/[slug]`
- Static generation for optimal performance

## Customization

### Adding New Languages

1. Add locale to `lib/i18n.ts`
2. Create content directory: `content/[locale]/`
3. Translate content files

### Styling

Tailwind classes are configured with:
- Custom typography styles in `globals.css`
- Dark mode support throughout
- Responsive design utilities

### Content Processing

Content is processed using:
- `gray-matter` for frontmatter parsing
- `remark` with GFM for markdown processing
- Reading time calculation
- Automatic excerpt generation

## Deployment

The site can be deployed to any Next.js compatible platform:

- **Vercel**: Automatic deployment
- **Netlify**: Static site generation
- **Self-hosted**: Docker or traditional hosting

## License

Part of the Deni AI project - see the main repository for license information.
