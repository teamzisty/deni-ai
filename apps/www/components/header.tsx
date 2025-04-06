"use client";

import { Link } from "@/i18n/navigation";
// import LanguageSwitcher from './LanguageSwitcher';

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@repo/ui/components/navigation-menu";
import { useTranslations } from "next-intl";

export function Header() {
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 px-8 w-full items-center justify-between">
        <h1 className="text-xl font-bold w-48">Deni AI</h1>
        <div className="flex w-full items-center justify-end space-x-2">
          {/* <LanguageSwitcher className="mr-2" /> */}
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem className="ml-3">
                <NavigationMenuLink
                  asChild
                  className={navigationMenuTriggerStyle()}
                >
                  <Link href="/" target="_blank">
                    {t("header.home")}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
            <NavigationMenuList>
              <NavigationMenuItem className="ml-3">
                <Link href="/home" passHref legacyBehavior target="_blank">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    {t("header.app")}
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
            <NavigationMenuList>
              <NavigationMenuItem className="ml-3">
                <Link
                  href="https://github.com/raicdev/upl-next"
                  passHref
                  legacyBehavior
                  target="_blank"
                >
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    {t("header.sourceCode")}
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
    </header>
  );
}
