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
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Welcome to Deni AI Docs
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Welcome to Deni AI Docs! You can get started by exploring our
            documentation.
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
      </div>
    </div>
  );
}
