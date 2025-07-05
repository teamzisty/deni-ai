import { JSDOM, VirtualConsole } from 'jsdom';

export interface ParsedContent {
  content: string;
  url: string;
  wordCount: number;
}

export interface ParseOptions {
  timeout?: number;
  userAgent?: string;
  includeImages?: boolean;
  maxContentLength?: number;
}

export class PageParser {
  private defaultOptions: ParseOptions = {
    timeout: 10000,
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    includeImages: false,
    maxContentLength: 50000,
  };

  async parseUrl(url: string, options?: ParseOptions): Promise<ParsedContent> {
    const opts = { ...this.defaultOptions, ...options };

    try {
      // Validate URL
      const urlObj = new URL(url);
      if (!["http:", "https:"].includes(urlObj.protocol)) {
        throw new Error(
          "Invalid URL protocol. Only HTTP and HTTPS are supported.",
        );
      }

      // Fetch content
      const html = await this.fetchContent(url, opts);

      // Parse content
      return this.parseContent(html, url, opts);
    } catch (error) {
      throw new Error(
        `Failed to parse URL: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private async fetchContent(
    url: string,
    options: ParseOptions,
  ): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": options.userAgent!,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate",
          Connection: "keep-alive",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("text/html")) {
        throw new Error("Content is not HTML");
      }

      return await response.text();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private parseContent(
    html: string,
    url: string,
    options: ParseOptions,
  ): ParsedContent {
    const virtualConsole = new VirtualConsole();
    virtualConsole.on("jsdomError", (error) => {
      if (!error.message.includes("Could not parse CSS stylesheet")) {
        console.error(error);
      }
    });

    // JSDOMのコンストラクタにvirtualConsoleを渡す
    const dom = new JSDOM(html, { virtualConsole });
    const document = dom.window.document;

    // Remove unwanted elements
    this.removeUnwantedElements(document);
    const content = this.extractMainContent(document, options);

    return {
      content,
      url,
      wordCount: this.countWords(content),
    };
  }

  private removeUnwantedElements(document: Document): void {
    const unwantedSelectors = [
      "script",
      "style",
      "nav",
      "header",
      "footer",
      ".advertisement",
      ".sidebar",
      ".popup",
      '[role="banner"]',
      '[role="navigation"]',
      '[role="complementary"]',
    ];

    unwantedSelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => el.remove());
    });
  }

  private extractMainContent(
    document: Document,
    options: ParseOptions,
  ): string {
    // Try to find main content area
    const contentSelectors = [
      "main",
      "article",
      ".post-content",
      ".article-content",
      ".content",
      "#content",
      ".entry-content",
      '[role="main"]',
    ];

    let contentElement: Element | null = null;

    for (const selector of contentSelectors) {
      contentElement = document.querySelector(selector);
      if (contentElement) break;
    }

    // Fallback to body if no main content found
    if (!contentElement) {
      contentElement = document.body;
    }

    if (!contentElement) {
      return "";
    }

    // Extract text content
    let content = this.extractTextFromElement(contentElement, options);

    // Limit content length if specified
    if (options.maxContentLength && content.length > options.maxContentLength) {
      content = content.substring(0, options.maxContentLength) + "...";
    }

    return content.trim();
  }

  private extractTextFromElement(
    element: Element,
    options: ParseOptions,
  ): string {
    const textNodes: string[] = [];

    const walker = element.ownerDocument?.createTreeWalker(
      element,
      element.ownerDocument.defaultView?.NodeFilter.SHOW_TEXT || 4,
      null,
    );

    if (!walker) return "";

    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim();
      if (text) {
        textNodes.push(text);
      }
    }

    return textNodes.join(" ").replace(/\s+/g, " ");
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter((word) => word.length > 0).length;
  }
}

// Export singleton instance
export const pageParser = new PageParser();

// Utility function for quick parsing
export async function parseUrl(
  url: string,
  options?: ParseOptions,
): Promise<ParsedContent> {
  return pageParser.parseUrl(url, options);
}
