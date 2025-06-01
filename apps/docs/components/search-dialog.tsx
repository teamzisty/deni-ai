"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import Link from "next/link";

interface SearchResult {
  type: "blog" | "docs";
  title: string;
  description: string;
  url: string;
}

export function SearchDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchContent = async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data.results || []);
      } catch (error) {
        console.error("Search failed:", error);
        setResults([]);
      }
    };

    const timeoutId = setTimeout(searchContent, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [query]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-white dark:bg-gray-900 px-1.5 font-mono text-xs text-gray-400">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[20vh]">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search documentation..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-lg placeholder:text-gray-400 outline-none"
            autoFocus
          />
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {results.length > 0 && (
          <div className="max-h-80 overflow-y-auto">
            {results.map((result, index) => (
              <Link
                key={index}
                href={result.url}
                onClick={() => setIsOpen(false)}
                className="flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {result.title}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                      {result.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {result.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
        
        {query && results.length === 0 && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No results found for "{query}"
          </div>
        )}
      </div>
    </div>
  );
}
