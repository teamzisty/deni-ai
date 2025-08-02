import { getAllBlogPosts } from "docsfly";
import { BlogMain } from "docsfly/components";

export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  
  // Generate params for all blog posts
  const params = posts.map((post) => ({
    slug: post.slug.split("/"),
  }));
  
  // Add the root page (blog listing)
  params.push({ slug: [] });
  
  return params;
}


export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  return <BlogMain params={params} />;
}
