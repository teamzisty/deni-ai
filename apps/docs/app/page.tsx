import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, Zap, Palette, Code } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-foreground/80 sm:text-6xl">
            Build Docs with{" "}
            <span className="text-foreground">Docsfly</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            A best method for creating beautiful, fast, and developer-friendly
            documentation sites. <br />
            Built with Next.js 15, shadcn/ui, and Tailwind CSS.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/docs">Get Started</Link>
            </Button>
            <Button variant="outline" size="lg">
              <Link
                href="https://github.com/usedocsfly/docsfly"
                target="_blank"
                rel="noopener noreferrer"
              >
                View on GitHub
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          <Card>
            <CardHeader>
              <BookOpen className="h-8 w-8 text-blue-600" />
              <CardTitle>MDX Support</CardTitle>
              <CardDescription>
                Write documentation with MDX, combining Markdown with React
                components
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-yellow-600" />
              <CardTitle>Fast Performance</CardTitle>
              <CardDescription>
                Built on Next.js 15 with App Router and Turbopack for
                lightning-fast builds
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Palette className="h-8 w-8 text-purple-600" />
              <CardTitle>Beautiful UI</CardTitle>
              <CardDescription>
                Styled with shadcn/ui components and Tailwind CSS for a modern
                look
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Code className="h-8 w-8 text-green-600" />
              <CardTitle>Developer Friendly</CardTitle>
              <CardDescription>
                TypeScript support, file-based routing, and hot reloading out of
                the box
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
  