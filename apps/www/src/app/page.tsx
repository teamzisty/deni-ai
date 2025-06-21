import Image from "next/image";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { LockIcon, Rocket, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image
                src="/vercel.svg"
                alt="Vercel"
                width={24}
                height={24}
                className="dark:invert"
              />
            </div>
            <div className="flex items-center space-x-8">
              <nav className="hidden md:flex space-x-6">
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Products
                </a>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Solutions
                </a>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Resources
                </a>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Docs
                </a>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Pricing
                </a>
              </nav>
              <Button size="sm">Contact Sales</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 py-6 text-center relative my-4">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          AI Chatbot with Your flavor
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Fully customizable AI chatbot. It is free and have unlimited uses
          (exclude premium models). No credit card required.
        </p>
        <Badge className="bg-orange-500 text-white mb-2">
          <Rocket className="inline" />
          <span className="ml-1">New rewrite is here!</span>
        </Badge>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg">Get Started</Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="space-y-1 mb-8 text-center">
          <h1 className="text-3xl font-bold text-center">
            Features that make Deni AI stand out
          </h1>
          <p className="text-center text-muted-foreground">
            Discover the unique features that set Deni AI apart from the
            competition.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col space-y-6 h-full">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 p-6 rounded-lg flex-1 flex flex-col max-h-[250px]">
              <h3 className="text-lg font-semibold mb-4">
                Choose your colors and themes.
              </h3>

              <div className="flex flex-wrap items-center justify-center gap-3 mb-4 flex-1">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Blue</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">Purple</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Green</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-orange-500 rounded-full"></div>
                  <span className="text-sm">Orange</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Red</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-pink-500 rounded-full"></div>
                  <span className="text-sm">Pink</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-indigo-500 rounded-full"></div>
                  <span className="text-sm">Indigo</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Yellow</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Choose from a variety of colors and themes to match your flavor.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold">
                Fully customizable AI chatbot.
              </h3>
              <p className="text-muted-foreground">
                Customize your AI chatbot with tone, colors, and themes.
              </p>
            </div>
          </div>
          <div className="flex flex-col space-y-6 h-full">
            <div className="bg-black text-green-400 p-3 rounded text-xs font-mono overflow-auto flex flex-col min-h-[250px]">
              <div className="whitespace-nowrap">
                $ git clone https://github.com/raicdev/deni-ai.git
              </div>
              <div className="whitespace-nowrap">
                {">"} Cloning into 'deni-ai'...
              </div>
              <div className="whitespace-nowrap">
                {">"} remote: Counting objects: 670, done.
              </div>
              <div className="whitespace-nowrap">
                {">"} remote: Compressing objects: 100% (2/2), done.
              </div>
              <div className="whitespace-nowrap">
                {">"} remote: Total 670 (delta 0), reused 0 (delta 0),
              </div>
              <div className="whitespace-nowrap">pack-reused 668</div>
              <div className="whitespace-nowrap">
                {">"} Receiving objects: 100% (670/670), 1.01 MiB | 2.00 MiB/s,
              </div>
              <div className="whitespace-nowrap">done.</div>
              <div className="whitespace-nowrap">
                {">"} Resolving deltas: 100% (370/370), done.
              </div>
              <div className="whitespace-nowrap">
                {">"} Unpacking objects: 100% (670/670), done.
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-semibold">
                Free, Unlimited Uses, Open Source
              </h3>
              <p className="text-muted-foreground">
                No limits on usage(*exclude premium models). No credit card
                required. Fully open source.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Setup once, use forever.</h2>
        <p className="text-lg text-muted-foreground mb-8">
          No limits on usage and No credit card required. No subscriptions.
          <br />
          Leave of chains and start using Deni AI today.
        </p>
        <Button size="lg">Getting Started</Button>
      </section>

      {/* Final CTA with Large Button */}
      <section className="bg-black text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-8">Start Chatting</h2>
          <Button variant="secondary" size="lg">
            Get Started for Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Previews</li>
                <li>Deployments</li>
                <li>Domains</li>
                <li>Analytics</li>
                <li>Edge Functions</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Docs</li>
                <li>Examples</li>
                <li>Changelog</li>
                <li>Templates</li>
                <li>Integrations</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">More</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Commerce</li>
                <li>Contact</li>
                <li>Enterprise</li>
                <li>Partners</li>
                <li>Security</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Trademark Policy</li>
                <li>Inactivity Policy</li>
                <li>DPA</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>About</li>
                <li>Blog</li>
                <li>Careers</li>
                <li>Customer Stories</li>
                <li>Design System</li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Image
                src="/vercel.svg"
                alt="Vercel"
                width={20}
                height={20}
                className="dark:invert"
              />
              <span className="text-sm text-muted-foreground">
                © 2024 Vercel Inc.
              </span>
            </div>
            <div className="flex space-x-4">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className="text-sm text-muted-foreground">Feedback</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
