"use client";

import { Link } from "@/i18n/navigation";
import { useState } from "react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
  NavigationMenuContent,
  NavigationMenuTrigger,
} from "@workspace/ui/components/navigation-menu";
import { useTranslations } from "next-intl";
import { Menu, X, Check, Globe } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerClose,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/drawer";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@workspace/ui/components/dropdown-menu";
import { useParams, usePathname } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

// Language Switcher component
function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations();
  const pathname = usePathname();
  const params = useParams();
  const currentLocale = params.locale as string;

  const switchToLanguage = (locale: string) => {
    if (currentLocale === locale) return;
    window.location.href = pathname.replace(`/${currentLocale}`, `/${locale}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("text-foreground/70 hover:text-foreground", className)}
        >
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => switchToLanguage("ja")}>
          日本語 {currentLocale === "ja" && <Check className="ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => switchToLanguage("en")}>
          English {currentLocale === "en" && <Check className="ml-auto" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header() {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);

  const navigationLinks = [
    {
      href: "/",
      label: t("header.home"),
      dropdown: false,
    },
    {
      href: "",
      label: t("header.app"),
      dropdown: false,
    },
    {
      href: "#",
      label: t("header.info"),
      dropdown: true,
      items: [
        { href: "/privacy-policy", label: t("header.privacyPolicy") },
        { href: "/terms-of-service", label: t("header.termsOfService") },
        {
          href: "https://github.com/raicdev/deni-ai",
          label: t("header.sourceCode"),
        },
      ],
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <h1 className="text-xl font-bold">Deni AI</h1>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {navigationLinks.map((link, index) => (
            <div key={index}>
              {link.dropdown ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">
                      {link.label}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-[180px]">
                    {link.items?.map((item, itemIndex) => (
                      <DropdownMenuItem key={itemIndex} asChild>
                        <Link
                          href={item.href}
                          target={
                            item.href.startsWith("http") ? "_blank" : undefined
                          }
                        >
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          <Link href="/" className="hidden md:flex">
            <Button variant="default" size="sm">
              {t("header.app")}
            </Button>
          </Link>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Drawer direction="right" open={isOpen} onOpenChange={setIsOpen}>
              <DrawerTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-foreground/70"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="pt-0">
                <DrawerHeader className="border-b p-4 flex items-center flex-row justify-between">
                  <DrawerTitle>Menu</DrawerTitle>
                  <DrawerClose asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </DrawerClose>
                </DrawerHeader>
                <div className="flex flex-col p-4 space-y-3">
                  {navigationLinks.map((link, index) =>
                    link.dropdown ? (
                      <div key={index} className="flex flex-col space-y-2">
                        <p className="px-4 py-2 font-medium">{link.label}</p>
                        <div className="pl-4 border-l border-border space-y-2">
                          {link.items?.map((item, itemIndex) => (
                            <Link
                              key={itemIndex}
                              href={item.href}
                              target={
                                item.href.startsWith("http")
                                  ? "_blank"
                                  : undefined
                              }
                              className="px-4 py-2 hover:bg-muted rounded-md w-full text-left block"
                              onClick={() => setIsOpen(false)}
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Link
                        key={index}
                        href={link.href}
                        target={
                          link.href.startsWith("http") ? "_blank" : undefined
                        }
                        className="px-4 py-2 hover:bg-muted rounded-md w-full text-left"
                        onClick={() => setIsOpen(false)}
                      >
                        {link.label}
                      </Link>
                    )
                  )}

                  <div className="pt-4 mt-4 border-t border-border">
                    <Button variant="default" asChild className="w-full">
                      <Link href="/" onClick={() => setIsOpen(false)}>
                        {t("header.app")}
                      </Link>
                    </Button>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </div>
    </header>
  );
}
