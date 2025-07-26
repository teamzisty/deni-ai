import { BlogLayout } from 'docsfly'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {  
  return <BlogLayout>{children as any}</BlogLayout>;
}