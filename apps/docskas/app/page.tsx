import { Header } from "@/components/header-new";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import {
  ArrowRight,
  Zap,
  Shield,
  Code,
  BookOpen,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="relative isolate px-6 pt-14 lg:px-8">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
          />
        </div>

        <div className="mx-auto max-w-6xl py-24 sm:py-32">
          <div className="text-center">
            <Badge variant="outline" className="mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              New docs available!
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              Deni AI
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}
                Documentation
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Comprehensive guides and API reference for building powerful
              AI-driven applications. Get started with our intuitive
              documentation and examples.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/docs/getting-started">
                <Button size="lg" className="gap-2">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/docs">
                <Button variant="outline" size="lg" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Browse Docs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600 dark:text-blue-400">
              Why Choose Deni AI
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Everything you need for AI conversations{" "}
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Built with modern technology stack and designed for developers who
              want powerful, customizable AI interactions.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-5xl sm:mt-20 lg:mt-24">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="relative hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle>Lightning Fast</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Optimized performance with efficient caching and smart
                    response handling for instant AI interactions.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="relative hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-green-600">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle>Enterprise Ready</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Built with security and privacy in mind. Enterprise-grade
                    features for teams and organizations.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="relative hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                      <Code className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle>Developer First</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Comprehensive APIs, detailed documentation, and extensive
                    customization options for developers.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Choose your path and start building with Deni AI today.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-4xl sm:mt-20 lg:mt-24">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Card className="relative p-6 hover:shadow-lg transition-all border-2 hover:border-blue-200 dark:hover:border-blue-800">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div>
                      <CardTitle className="text-xl">For Developers</CardTitle>
                      <CardDescription>
                        Start building with our APIs and SDKs
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Get up and running quickly with our comprehensive developer
                    documentation, examples, and guides.
                  </p>
                  <Link href="/docs/getting-started/installation">
                    <Button className="w-full gap-2">
                      <BookOpen className="h-4 w-4" />
                      Start Building
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="relative p-6 hover:shadow-lg transition-all border-2 hover:border-purple-200 dark:hover:border-purple-800">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-8 w-8 text-purple-600" />
                    <div>
                      <CardTitle className="text-xl">
                        Explore Examples
                      </CardTitle>
                      <CardDescription>See Deni AI in action</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Browse our collection of examples and use cases to
                    understand what's possible with Deni AI.
                  </p>
                  <Link href="/examples">
                    <Button variant="outline" className="w-full gap-2">
                      <Code className="h-4 w-4" />
                      View Examples
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-blue-600 dark:bg-blue-700">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Start building today
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-100">
              Join thousands of developers already building amazing AI-powered
              applications with Deni AI.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/getting-started/installation">
                <Button size="lg" variant="secondary" className="gap-2">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link
                href="https://github.com/raicdev/deni-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold leading-6 text-white hover:text-blue-100"
              >
                View on GitHub <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
