import fs from "fs";
import path from "path";
import matter from "gray-matter";
import remarkGfm from "remark-gfm";

// Export plugins for use in MDX (simplified for now)
export const remarkPlugins = [remarkGfm];
export const rehypePlugins: any[] = [];

const contentDirectory = path.join(process.cwd(), "content");

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  content: string;
  readingTime: number;
  images?: string[];
  hasDirectory?: boolean;
}

export interface DocPage {
  slug: string;
  title: string;
  description: string;
  content: string;
  order?: number;
  category?: string;
  date?: string;
  author?: string;
  excerpt?: string;
  readingTime?: number;
}

export function getAllBlogPosts(lang?: string): BlogPost[] {
  console.log("Content directory:", lang);
  const blogDir = path.join(contentDirectory, lang || "", "blog");
  console.log("Blog directory:", blogDir);

  if (!fs.existsSync(blogDir)) {
    return [];
  }

  const items = fs.readdirSync(blogDir);
  const allPostsData: BlogPost[] = [];

  for (const item of items) {
    const itemPath = path.join(blogDir, item);
    const stat = fs.statSync(itemPath);

    if (stat.isFile() && item.endsWith(".md")) {
      // Handle direct .md files
      const slug = item.replace(/\.md$/, "");
      const fileContents = fs.readFileSync(itemPath, "utf8");
      const { data, content } = matter(fileContents);

      // Calculate reading time (approximate)
      const wordsPerMinute = 200;
      const words = content.split(" ").length;
      const readingTime = Math.ceil(words / wordsPerMinute);

      allPostsData.push({
        slug,
        title: data.title || "",
        description: data.description || "",
        date: data.date || "",
        tags: data.tags || [],
        content,
        readingTime,
      });
    } else if (stat.isDirectory()) {
      // Handle directory/index.md format
      const indexPath = path.join(itemPath, "index.md");
      if (fs.existsSync(indexPath)) {
        const slug = item;
        const fileContents = fs.readFileSync(indexPath, "utf8");
        const { data, content } = matter(fileContents);

        // Calculate reading time (approximate)
        const wordsPerMinute = 200;
        const words = content.split(" ").length;
        const readingTime = Math.ceil(words / wordsPerMinute);

        // Find images in the same directory
        const images = fs
          .readdirSync(itemPath)
          .filter((file) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file))
          .map((file) => `/api/blog-assets/${slug}/${file}`);

        allPostsData.push({
          slug,
          title: data.title || "",
          description: data.description || "",
          date: data.date || "",
          tags: data.tags || [],
          content,
          readingTime,
          images,
          hasDirectory: true,
        });
      }
    }
  }

  // Sort by date
  return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getBlogPost(slug: string, lang?: string): BlogPost | null {
  try {
    // First try the direct .md file format
    const directPath = path.join(
      contentDirectory,
      lang || "",
      "blog",
      `${slug}.md`,
    );
    if (fs.existsSync(directPath)) {
      const fileContents = fs.readFileSync(directPath, "utf8");
      const { data, content } = matter(fileContents);

      const wordsPerMinute = 200;
      const words = content.split(" ").length;
      const readingTime = Math.ceil(words / wordsPerMinute);

      return {
        slug,
        title: data.title || "",
        description: data.description || "",
        date: data.date || "",
        tags: data.tags || [],
        content,
        readingTime,
      };
    } // Then try the directory/index.md format
    const indexPath = path.join(
      contentDirectory,
      lang || "",
      "blog",
      slug,
      "index.md",
    );
    if (fs.existsSync(indexPath)) {
      const fileContents = fs.readFileSync(indexPath, "utf8");
      const { data, content } = matter(fileContents);

      const wordsPerMinute = 200;
      const words = content.split(" ").length;
      const readingTime = Math.ceil(words / wordsPerMinute);

      // Find images in the same directory
      const dirPath = path.join(contentDirectory, lang || "", "blog", slug);
      const images = fs
        .readdirSync(dirPath)
        .filter((file) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file))
        .map((file) => `/api/blog-assets/${slug}/${file}`);

      return {
        slug,
        title: data.title || "",
        description: data.description || "",
        date: data.date || "",
        tags: data.tags || [],
        content,
        readingTime,
        images,
        hasDirectory: true,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function getAllDocPages(lang?: string): DocPage[] {
  const docsDir = path.join(contentDirectory, lang || "", "docs");
  console.log("Docs directory:", docsDir);

  if (!fs.existsSync(docsDir)) {
    return [];
  }

  function getPages(dir: string, basePath = ""): DocPage[] {
    const items = fs.readdirSync(dir);
    let pages: DocPage[] = [];

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        pages = pages.concat(getPages(fullPath, `${basePath}${item}/`));
      } else if (item.endsWith(".md")) {
        const slug = `${basePath}${item.replace(/\.md$/, "")}`;
        const fileContents = fs.readFileSync(fullPath, "utf8");
        const { data, content } = matter(fileContents);

        // Calculate reading time (approximate)
        const wordsPerMinute = 200;
        const words = content.split(" ").length;
        const readingTime = Math.ceil(words / wordsPerMinute);

        pages.push({
          slug,
          title: data.title || "",
          description: data.description || "",
          content,
          order: data.order || 0,
          category: data.category || "",
          date: data.date || "",
          author: data.author || "",
          excerpt: data.excerpt || data.description || "",
          readingTime,
        });
      }
    }

    return pages;
  }

  return getPages(docsDir).sort((a, b) => (a.order || 0) - (b.order || 0));
}

export function getDocPage(slug: string, lang?: string): DocPage | null {
  try {
    // Handle nested paths properly
    const fullPath = path.join(
      contentDirectory,
      lang || "",
      "docs",
      `${slug}.md`,
    );
    console.log("Full path for doc:", fullPath);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    // Calculate reading time (approximate)
    const wordsPerMinute = 200;
    const words = content.split(" ").length;
    const readingTime = Math.ceil(words / wordsPerMinute);

    return {
      slug,
      title: data.title || "",
      description: data.description || "",
      content,
      order: data.order || 0,
      category: data.category || "",
      date: data.date || "",
      author: data.author || "",
      excerpt: data.excerpt || data.description || "",
      readingTime,
    };
  } catch {
    return null;
  }
}

// Add aliases for consistency
export const getAllDocs = getAllDocPages;
export const getDocBySlug = getDocPage;
