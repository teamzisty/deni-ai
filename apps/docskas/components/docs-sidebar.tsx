"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar";
import {
  Book,
  Home,
  FileText,
  Settings,
  Zap,
  Code,
  Users,
  BookOpen,
  ExternalLink,
  Github,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";

interface NavItem {
  title: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string;
  external?: boolean;
  items?: NavItem[];
}

const navigation: NavItem[] = [
  {
    title: "Home",
    href: "/",
    icon: <Home className="h-4 w-4" />,
  },
  {
    title: "Getting Started",
    href: "/docs/",
    icon: <Zap className="h-4 w-4" />,
    items: [
      {
        title: "Introduction",
        href: "/docs/intro",
      },
      {
        title: "Getting Started",
        href: "/docs/getting-started",
      },
    ],
  },
  {
    title: "Setup Guide",
    href: "/docs/setup-guide",
    icon: <BookOpen className="h-4 w-4" />,
    items: [
      {
        title: "Create an Instance",
        href: "/docs/setup-guide/create-a-instance",
      },
      {
        title: "Modification",
        href: "/docs/setup-guide/modification",
      },
      {
        title: "Publish",
        href: "/docs/setup-guide/publish",
      },
    ],
  },
  {
    title: "Contribution",
    href: "/docs/contribution",
    icon: <Code className="h-4 w-4" />,
    items: [
      {
        title: "Translation",
        href: "/docs/contribution/changes-to-translation",
      },
      {
        title: "Setup Repository",
        href: "/docs/contribution/setup-repository",
      },
    ],
  },
  {
    title: "Blog",
    href: "/blog",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    title: "Community",
    href: "/community",
    icon: <Users className="h-4 w-4" />,
  },
];

const navigationJa: NavItem[] = [
  {
    title: "ホーム",
    href: "/ja",
    icon: <Home className="h-4 w-4" />,
  },
  {
    title: "はじめに",
    href: "/ja/docs/intro",
    icon: <Zap className="h-4 w-4" />,
    items: [
      {
        title: "概要",
        href: "/ja/docs/intro",
      },
      {
        title: "はじめに",
        href: "/ja/docs/getting-started",
      },
    ],
  },
  {
    title: "セットアップガイド",
    href: "/ja/docs/setup-guide",
    icon: <BookOpen className="h-4 w-4" />,
    items: [
      {
        title: "インスタンスの作成",
        href: "/ja/docs/setup-guide/create-a-instance",
      },
      {
        title: "Supabase の設定",
        href: "/ja/docs/setup-guide/setup-supabase",
      },
      {
        title: "変更方法",
        href: "/ja/docs/setup-guide/modification",
      },
      {
        title: "公開方法",
        href: "/ja/docs/setup-guide/publish",
      },
    ],
  },
  {
    title: "貢献",
    href: "/ja/docs/contribution",
    icon: <Code className="h-4 w-4" />,
    items: [
      {
        title: "翻訳の変更",
        href: "/ja/docs/contribution/changes-to-translation",
      },
      {
        title: "リポジトリのセットアップ",
        href: "/ja/docs/contribution/setup-repository",
      },
    ],
  },
  {
    title: "ブログ",
    href: "/ja/blog",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    title: "コミュニティ",
    href: "/ja/community",
    icon: <Users className="h-4 w-4" />,
  },
];

const getNavigation = (lang: string): NavItem[] => {
  switch (lang) {
    case "ja":
      return navigationJa;
    default:
      return navigation;
  }
};

const externalLinks: NavItem[] = [
  {
    title: "GitHub",
    href: "https://github.com/deni-ai/deni-ai",
    icon: <Github className="h-4 w-4" />,
    external: true,
  },
  {
    title: "Main App",
    href: "https://deniai.app",
    icon: <ExternalLink className="h-4 w-4" />,
    external: true,
  },
];

function NavItemComponent({
  item,
  level = 0,
}: {
  item: NavItem;
  level?: number;
}) {
  const pathname = usePathname();
  const isActive =
    pathname === item.href || pathname.startsWith(item.href + "/");
  const hasChildren = item.items && item.items.length > 0;

  if (hasChildren) {
    return (
      <SidebarGroup>
        {/* Parent item as clickable link */}
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            isActive={isActive}
            className={`${level > 0 ? "pl-6" : ""} font-medium`}
          >
            <Link
              href={item.href}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              className="flex items-center gap-2"
            >
              {item.icon}
              <span>{item.title}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {item.badge}
                </Badge>
              )}
              {item.external && <ExternalLink className="h-3 w-3 ml-auto" />}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>

        {/* Child items */}
        <SidebarGroupContent>
          <SidebarMenu>
            {item.items?.map((subItem) => (
              <SidebarMenuItem key={subItem.href}>
                <NavItemComponent item={subItem} level={level + 1} />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarMenuButton
      asChild
      isActive={isActive}
      className={`${level > 0 ? "pl-6" : ""}`}
    >
      <Link
        href={item.href}
        target={item.external ? "_blank" : undefined}
        rel={item.external ? "noopener noreferrer" : undefined}
        className="flex items-center gap-2"
      >
        {item.icon}
        <span>{item.title}</span>
        {item.badge && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {item.badge}
          </Badge>
        )}
        {item.external && <ExternalLink className="h-3 w-3 ml-auto" />}
      </Link>
    </SidebarMenuButton>
  );
}

export function DocsSidebar({ lang = "en" }: { lang?: string }) {
  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <div className="h-6 w-6 bg-primary rounded-sm flex items-center justify-center">
              <Book className="h-4 w-4 text-primary-foreground" />
            </div>
            <span>Deni AI Docs</span>
          </Link>
          <SidebarTrigger className="ml-auto" />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarMenu>
          {getNavigation(lang).map((item) => (
            <SidebarMenuItem key={item.href}>
              <NavItemComponent item={item} />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <SidebarGroup className="mt-8">
          <SidebarGroupLabel>Links</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {externalLinks.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <NavItemComponent item={item} />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t px-6 py-4">
        <div className="text-xs text-muted-foreground">
          © 2025 Deni AI. All rights reserved.
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
