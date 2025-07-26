# My Docsfly App

A documentation website built with [Docsfly](https://github.com/usedocsfly/docsfly).

## Getting Started

First, install the dependencies:

```bash
bun install
```

Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Writing Documentation

Create new MDX files in the `docs/` directory. Each file will automatically become a route.

Example:

```markdown
---
title: My Page
description: This is my documentation page
order: 1
---

# My Page

This is the content of my page.
```

## Customization

Edit `docsfly.config.ts` to customize your documentation site:

- Site metadata
- Theme colors
- Navigation
- And more!

## Deployment

The easiest way to deploy your Docsfly app is to use the [Vercel Platform](https://vercel.com/new).

Check out the [deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Learn More

- [Docsfly Documentation](https://docsfly.rai.bio)
- [Next.js Documentation](https://nextjs.org/docs)
- [MDX Documentation](https://mdxjs.com/)