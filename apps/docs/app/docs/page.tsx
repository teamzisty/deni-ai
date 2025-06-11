import { getAllDocPages } from "@/lib/content";
import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";

export default function DocsPage() {
  const docs = getAllDocPages();

  // Group docs by category
  const groupedDocs = docs.reduce(
    (acc, doc) => {
      const category = doc.category || "General";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(doc);
      return acc;
    },
    {} as Record<string, typeof docs>,
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Documentation
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Complete guides and API reference for Deni AI.
        </p>
      </div>

      {Object.keys(groupedDocs).length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Documentation Coming Soon
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            We're working on comprehensive documentation. Check back soon!
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
            <Link
              href="/getting-started"
              className="block p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Getting Started
                </h4>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Quick start guide to get up and running with Deni AI.
              </p>
            </Link>

            <div className="block p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  API Reference
                </h4>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Complete API documentation (coming soon).
              </p>
            </div>

            <div className="block p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Examples
                </h4>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Code examples and tutorials (coming soon).
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-8">
          {Object.entries(groupedDocs).map(([category, categoryDocs]) => (
            <div key={category}>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {category}
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categoryDocs.map((doc) => (
                  <Link
                    key={doc.slug}
                    href={`/docs/${doc.slug}`}
                    className="block p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow group"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {doc.title}
                    </h3>
                    {doc.description && (
                      <p className="text-gray-600 dark:text-gray-300 line-clamp-3">
                        {doc.description}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
