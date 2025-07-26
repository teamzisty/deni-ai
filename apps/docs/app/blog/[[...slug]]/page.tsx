import { BlogMain } from "docsfly/components";

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  return <BlogMain params={params} />;
}
