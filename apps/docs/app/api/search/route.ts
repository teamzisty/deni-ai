import { NextRequest, NextResponse } from "next/server";
import { getAllBlogPosts, getAllDocPages } from "@/lib/content";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ results: [] });
  }

  const searchQuery = query.toLowerCase();
  const results: Array<{
    type: "blog" | "docs";
    title: string;
    description: string;
    url: string;
  }> = [];

  try {
    // Search blog posts
    const blogPosts = getAllBlogPosts();
    blogPosts.forEach((post) => {
      if (
        post.title.toLowerCase().includes(searchQuery) ||
        post.description.toLowerCase().includes(searchQuery) ||
        post.tags.some((tag) => tag.toLowerCase().includes(searchQuery))
      ) {
        results.push({
          type: "blog",
          title: post.title,
          description: post.description,
          url: `/blog/${post.slug}`,
        });
      }
    });

    // Search documentation
    const docPages = getAllDocPages();
    docPages.forEach((doc) => {
      if (
        doc.title.toLowerCase().includes(searchQuery) ||
        doc.description.toLowerCase().includes(searchQuery) ||
        (doc.category && doc.category.toLowerCase().includes(searchQuery))
      ) {
        results.push({
          type: "docs",
          title: doc.title,
          description: doc.description,
          url: `/docs/${doc.slug}`,
        });
      }
    });

    // Limit results and sort by relevance (title matches first)
    const sortedResults = results
      .sort((a, b) => {
        const aTitleMatch = a.title.toLowerCase().includes(searchQuery);
        const bTitleMatch = b.title.toLowerCase().includes(searchQuery);
        if (aTitleMatch && !bTitleMatch) return -1;
        if (!aTitleMatch && bTitleMatch) return 1;
        return 0;
      })
      .slice(0, 8);

    return NextResponse.json({ results: sortedResults });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
