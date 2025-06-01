import { notFound } from "next/navigation";
import { getAllDocs, getDocBySlug } from "@/lib/content";
import DocContent from "@/components/doc-content";

interface DocsPageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export async function generateStaticParams() {
  const docs = getAllDocs();
  return docs.map((doc) => ({
    slug: doc.slug.split('/'),
  }));
}

export async function generateMetadata({ params }: DocsPageProps) {
  const { slug } = await params;
  const slugString = slug.join('/');
  const doc = getDocBySlug(slugString);

  if (!doc) {
    return {
      title: "Not Found",
    };
  }

  return {
    title: `${doc.title} - Deni AI Documentation`,
    description: doc.excerpt,
  };
}

export default async function DocsPage({ params }: DocsPageProps) {
  const { slug } = await params;
  const slugString = slug.join('/');
  const doc = getDocBySlug(slugString);

  if (!doc) {
    notFound();
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto">        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <a
            href="/docs"
            className="hover:text-gray-900 dark:hover:text-gray-200"
          >
            Documentation
          </a>
          {slug.map((segment, index) => (
            <div key={index} className="flex items-center gap-2">
              <span>/</span>
              {index === slug.length - 1 ? (
                <span className="text-gray-900 dark:text-gray-200 capitalize">
                  {segment.replace(/-/g, ' ')}
                </span>
              ) : (
                <a
                  href={`/docs/${slug.slice(0, index + 1).join('/')}`}
                  className="hover:text-gray-900 dark:hover:text-gray-200 capitalize"
                >
                  {segment.replace(/-/g, ' ')}
                </a>
              )}
            </div>
          ))}
        </nav>
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {doc.title}
          </h1>
          {doc.excerpt && (
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {doc.excerpt}
            </p>
          )}
          <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
            {doc.date && (
              <time dateTime={doc.date}>
                Last updated: {new Date(doc.date).toLocaleDateString()}
              </time>
            )}
            {doc.author && <span>By {doc.author}</span>}
            {doc.readingTime && <span>{doc.readingTime} min read</span>}
          </div>
        </header>{" "}
        {/* Content */}
        <DocContent content={doc.content} />

        {/* Navigation */}
        <nav className="flex items-center justify-between mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div>{/* Previous doc link could go here */}</div>
          <div>{/* Next doc link could go here */}</div>
        </nav>
      </div>
    </div>
  );
}
