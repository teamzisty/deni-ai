import { DocsSidebar } from "@/components/docs-sidebar";
import { Header } from "@/components/header-new";
import { SidebarInset } from "@workspace/ui/components/sidebar";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { Badge } from "@workspace/ui/components/badge";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Edit, Github, Home } from "lucide-react";

interface DocsLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  breadcrumbs?: Array<{ title: string; href?: string }>;
  editPath?: string;
  lastUpdated?: string;
  toc?: Array<{ title: string; href: string; level: number }>;
  navigation?: {
    prev?: { title: string; href: string };
    next?: { title: string; href: string };
  };
}

export function DocsLayout({
  children,
  title,
  description,
  breadcrumbs,
  editPath,
  lastUpdated,
  toc,
  navigation,
}: DocsLayoutProps) {
  return (
    <div className="flex min-h-screen w-full">
      <DocsSidebar />
      <SidebarInset className="flex-1">
        <Header />
        <main className="flex-1">
          <div className="flex">
            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="px-6 py-6 lg:px-8">
                {" "}
                {/* Breadcrumbs */}
                {breadcrumbs && breadcrumbs.length > 0 && (
                  <nav className="mb-6" aria-label="Breadcrumb">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      {breadcrumbs.map((crumb, index) => (
                        <div key={index} className="flex items-center">
                          {index > 0 && <span className="mx-2">/</span>}
                          {crumb.href && index < breadcrumbs.length - 1 ? (
                            <Link
                              href={crumb.href}
                              className="hover:text-foreground transition-colors"
                            >
                              {crumb.title}
                            </Link>
                          ) : (
                            <span className="text-foreground font-medium">
                              {crumb.title}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </nav>
                )}
                {/* Page Header */}
                {(title || description) && (
                  <div className="mb-8">
                    {title && (
                      <h1 className="text-4xl font-bold tracking-tight mb-4">
                        {title}
                      </h1>
                    )}
                    {description && (
                      <p className="text-lg text-muted-foreground max-w-3xl">
                        {description}
                      </p>
                    )}
                    {lastUpdated && (
                      <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                        <span>Last updated: {lastUpdated}</span>
                        {editPath && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link
                              href={`https://github.com/deni-ai/deni-ai/edit/main/apps/docs/${editPath}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1"
                            >
                              <Edit className="h-3 w-3" />
                              Edit this page
                            </Link>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {/* Content */}
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  {children}
                </div>
                {/* Navigation */}
                {navigation && (navigation.prev || navigation.next) && (
                  <div className="flex justify-between items-center pt-8 mt-8 border-t">
                    <div className="flex-1">
                      {navigation.prev && (
                        <Button variant="ghost" asChild className="h-auto p-0">
                          <Link
                            href={navigation.prev.href}
                            className="flex items-center gap-2 text-sm"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            <div className="text-left">
                              <div className="text-xs text-muted-foreground">
                                Previous
                              </div>
                              <div className="font-medium">
                                {navigation.prev.title}
                              </div>
                            </div>
                          </Link>
                        </Button>
                      )}
                    </div>
                    <div className="flex-1 text-right">
                      {navigation.next && (
                        <Button variant="ghost" asChild className="h-auto p-0">
                          <Link
                            href={navigation.next.href}
                            className="flex items-center gap-2 text-sm justify-end"
                          >
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground">
                                Next
                              </div>
                              <div className="font-medium">
                                {navigation.next.title}
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Table of Contents */}
            {toc && toc.length > 0 && (
              <div className="hidden xl:block w-64 shrink-0">
                <div className="sticky top-20 h-[calc(100vh-5rem)] overflow-hidden">
                  <ScrollArea className="h-full px-4 py-6">
                    <div className="text-sm font-medium mb-4">On this page</div>
                    <nav className="space-y-1">
                      {toc.map((item, index) => (
                        <Link
                          key={index}
                          href={item.href}
                          className={`block py-1 text-sm transition-colors hover:text-foreground ${
                            item.level === 1
                              ? "text-foreground"
                              : item.level === 2
                                ? "pl-3 text-muted-foreground"
                                : "pl-6 text-muted-foreground"
                          }`}
                        >
                          {item.title}
                        </Link>
                      ))}
                    </nav>
                  </ScrollArea>
                </div>
              </div>
            )}
          </div>
        </main>
      </SidebarInset>
    </div>
  );
}
