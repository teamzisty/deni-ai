"use client";

import { Link } from "@/i18n/navigation";
// import LanguageSwitcher from './LanguageSwitcher';
import { useState } from "react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@workspace/ui/components/navigation-menu";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerClose,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/drawer";

export function Header() {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);

  const navigationLinks = [
    { href: "/", label: t("header.home") },
    { href: "/home", label: t("header.app") },
    { href: "/privacy-policy", label: t("header.privacyPolicy") },
    { href: "/terms-of-service", label: t("header.termsOfService") },
    { href: "https://github.com/raicdev/deni-ai", label: t("header.sourceCode") },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 px-8 w-full items-center justify-between">
        <h1 className="text-xl font-bold w-48">Deni AI</h1>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex w-full items-center justify-end space-x-2">
          {/* <LanguageSwitcher className="mr-2" /> */}
          <NavigationMenu>
            <NavigationMenuList>
              {navigationLinks.map((link, index) => (
                <NavigationMenuItem key={index} className="ml-3">
                  <NavigationMenuLink
                    asChild
                    className={navigationMenuTriggerStyle()}
                  >
                    <Link href={link.href} target="_blank">
                      {link.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        
        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Drawer direction="right" open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
              <button className="p-2">
                <Menu className="h-6 w-6" />
              </button>
            </DrawerTrigger>
            <DrawerContent className="pt-0">
              <DrawerHeader className="border-b p-4 flex items-center flex-row justify-between">
                <DrawerTitle>Menu</DrawerTitle>
                <DrawerClose asChild>
                  <button className="p-1 rounded-full">
                    <X className="h-5 w-5" />
                  </button>
                </DrawerClose>
              </DrawerHeader>
              <div className="flex flex-col p-4 space-y-3">
                {navigationLinks.map((link, index) => (
                  <Link 
                    key={index}
                    href={link.href}
                    target="_blank"
                    className="px-4 py-2 hover:bg-muted rounded-md w-full text-left"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </header>
  );
}
