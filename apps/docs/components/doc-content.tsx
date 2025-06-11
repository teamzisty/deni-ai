"use client";

import ReactMarkdown from "@uiw/react-markdown-preview";

interface DocContentProps {
  content: string;
  blogSlug?: string;
}

export default function DocContent({ content, blogSlug }: DocContentProps) {
  // Transform relative image paths to absolute paths for blog posts
  const transformedContent = blogSlug
    ? content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
        // If the src doesn't start with http/https or /, it's a relative path
        if (!src.startsWith("http") && !src.startsWith("/")) {
          return `![${alt}](/api/blog-assets/${blogSlug}/${src})`;
        }
        return match;
      })
    : content;

  return (
    <article className="prose prose-lg dark:prose-invert max-w-none">
      <ReactMarkdown
        source={transformedContent}
        className="font-sans!"
        style={{ backgroundColor: "transparent" }}
      ></ReactMarkdown>
    </article>
  );
}
