import { getAllDocs, getDocBySlug, DocsListing, DocsPage  } from "docsfly";

export default async function Page({
  params: _params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  // Await the params to ensure they are resolved before passing to DocsPage
  const params = await _params;
  const post = await getDocBySlug(params.slug ? params.slug.join("/") : "");
  if (!post) {
    const docs = await getAllDocs();
    return <DocsListing docs={docs} />;
  }
  
  return (
    <DocsPage
      title={post.meta.title}
      description={post.meta.description}
      lastUpdated={post.meta.updatedAt}
      tags={post.meta.tags}
    >
      {post.content}
    </DocsPage>
  );
}
