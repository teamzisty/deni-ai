"use client";

import React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Input } from "@workspace/ui/components/input";
import { Badge } from "@workspace/ui/components/badge";
import {
  Sun,
  Moon,
  Search,
  Github,
  ExternalLink,
  Menu,
  ChevronDown,
} from "lucide-react";
import { useSidebar } from "@workspace/ui/components/sidebar";

const navItems = [
  {
    title: "Guide",
    href: "/docs",
    children: [
      { title: "Getting Started", href: "/getting-started" },
      { title: "Installation", href: "/getting-started/installation" },
      { title: "Configuration", href: "/getting-started/configuration" },
    ],
  },
  {
    title: "Reference",
    href: "/docs/api",
    children: [
      { title: "API", href: "/docs/api" },
      { title: "Components", href: "/docs/components" },
      { title: "CLI", href: "/docs/cli" },
    ],
  },
  {
    title: "Examples",
    href: "/examples",
  },
  {
    title: "Blog",
    href: "/blog",
  },
];

export function Header() {
  const { theme, setTheme } = useTheme();
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden mr-2"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo */}
        <div className="flex items-center gap-2 mr-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <div className="h-6 w-6 bg-primary rounded-sm flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">D</span>
            </div>
            <span className="hidden sm:inline-block">Deni AI</span>
          </Link>
          <Badge variant="secondary" className="text-xs">
            Docs
          </Badge>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 flex-1">
          {navItems.map((item) => (
            <div key={item.title}>
              {item.children ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-auto p-2">
                      {item.title}
                      <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {item.children.map((child) => (
                      <DropdownMenuItem key={child.href} asChild>
                        <Link href={child.href}>{child.title}</Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="ghost" asChild className="h-auto p-2">
                  <Link href={item.href}>{item.title}</Link>
                </Button>
              )}
            </div>
          ))}
        </nav>

        {/* Search */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative hidden lg:block">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search docs..."
              className="w-64 pl-8"
              type="search"
            />
          </div>

          {/* Theme toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* GitHub link */}
          <Button variant="ghost" size="icon" asChild>
            <Link
              href="https://github.com/deni-ai/deni-ai"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-4 w-4" />
            </Link>
          </Button>

          {/* External app link */}
          <Button size="sm" asChild>
            <Link
              href="https://deniai.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1"
            >
              Launch App
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
