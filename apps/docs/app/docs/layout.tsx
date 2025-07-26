import { DocsLayout, generateNavigation } from 'docsfly'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const navigation = await generateNavigation();
  
  return <DocsLayout navigation={navigation}>{children as any}</DocsLayout>;
}