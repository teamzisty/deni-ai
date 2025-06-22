import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Code2, Sparkles, Zap, Globe, Download, Star } from "lucide-react";
import Link from "next/link";

export default function IntellipulsePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Intellipulse
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-6">
            The new generation of vibe coding
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Experience the future of coding with AI-powered assistance that
            understands your flow and enhances your productivity
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Web-Based
              </CardTitle>
              <CardDescription>
                Code anywhere with our powerful web interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No installation required. Start coding instantly in your browser
                with full AI assistance.
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-purple-600" />
                VS Code Extension
                <Badge variant="secondary" className="text-xs">
                  Coming Soon
                </Badge>
              </CardTitle>
              <CardDescription>
                Bring Intellipulse directly to your favorite editor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Seamless integration with VS Code for developers who prefer
                their familiar environment.
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800 md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-600" />
                Free & Unlimited
              </CardTitle>
              <CardDescription>
                No limits, no subscriptions, just pure coding joy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enjoy unlimited AI-powered coding assistance without any
                restrictions or paywalls.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Key Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            What makes Intellipulse special?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-yellow-500 mt-1" />
                <div>
                  <h3 className="font-semibold">Vibe-Based Coding</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    AI that understands your coding style and adapts to your
                    workflow
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-yellow-500 mt-1" />
                <div>
                  <h3 className="font-semibold">Intelligent Suggestions</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Context-aware code completions and refactoring suggestions
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-yellow-500 mt-1" />
                <div>
                  <h3 className="font-semibold">Multi-Language Support</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Works with all popular programming languages and frameworks
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-yellow-500 mt-1" />
                <div>
                  <h3 className="font-semibold">Real-time Collaboration</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Share your coding sessions and get help from the community
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-yellow-500 mt-1" />
                <div>
                  <h3 className="font-semibold">Privacy First</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your code is in local, we never store or share your data.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-yellow-500 mt-1" />
                <div>
                  <h3 className="font-semibold">Zero Setup</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Start coding immediately without any configuration
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold mb-4">
            Ready to experience the future of coding?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Join thousands of developers who are already coding with
            Intellipulse
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700" asChild>
              <Link href="/intellipulse">
                <Globe className="mr-2 h-4 w-4" />
                Try Web Version
              </Link>
            </Button>
            <Button variant="outline" size="lg" disabled>
              <Download className="mr-2 h-4 w-4" />
              VS Code Extension (Coming Soon)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
