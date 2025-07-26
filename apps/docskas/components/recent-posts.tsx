import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
}

interface RecentPostsProps {
  posts: BlogPost[];
}

export function RecentPosts({ posts }: RecentPostsProps) {
  return (
    <div className="space-y-8">
      {" "}
      <div className="grid gap-8 lg:grid-cols-3">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="group relative flex flex-col bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-6 flex-1">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                <Calendar className="h-4 w-4" />
                <time dateTime={post.date}>
                  {format(new Date(post.date), "MMMM d, yyyy")}
                </time>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                <Link href={`/blog/${post.slug}`} className="absolute inset-0">
                  <span className="sr-only">Read article</span>
                </Link>
                {post.title}
              </h3>

              <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                {post.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="text-center">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium transition-colors"
        >
          View all blog posts
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
