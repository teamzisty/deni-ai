"use client";

import { BookOpenIcon, InfoIcon, LifeBuoyIcon } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@workspace/ui/components/navigation-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import Logo from "./logo";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "@/hooks/use-translations";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeSwitcher } from "./theme-switcher";

interface NavigationItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  description?: string;
  submenu?: boolean;
  type?: "icon" | "description";
  items?: NavigationItem[];
}

export default function Header() {
  const t = useTranslations("nav");

  // Navigation links array to be used in both desktop and mobile menus
  const navigationLinks: NavigationItem[] = [
    { href: "/", label: t("home") },
    {
      label: t("features"),
      submenu: true,
      type: "description",
      items: [
        {
          href: "/features/search",
          label: t("search"),
          description: t("searchDescription"),
        },
      ],
    },
    {
      label: t("resources"),
      submenu: true,
      type: "icon",
      items: [
        {
          href: "https://docs.deniai.app/",
          label: t("docs"),
          icon: "BookOpenIcon",
        },
        {
          href: "https://docs.deniai.app/docs/intro",
          label: t("gettingStarted"),
          icon: "LifeBuoyIcon",
        },
        {
          href: "https://docs.deniai.app/blog/",
          label: t("changelog"),
          icon: "InfoIcon",
        },
      ],
    },
    {
      label: t("more"),
      submenu: true,
      type: "description",
      items: [
        {
          href: "/more/student",
          label: t("student"),
          description: t("studentDescription"),
        },
        {
          href: "/more/contributors",
          label: t("contributors"),
          description: t("contributorsDescription"),
        },
        {
          href: "/more/contact",
          label: t("contact"),
          description: t("contactDescription"),
        },
        {
          href: "/more/partners",
          label: t("partners"),
          description: t("partnersDescription"),
        },
      ],
    },
  ];

  return (
    <header className="border-b px-4 md:px-6">
      <div className="flex h-16 items-center justify-between gap-4">
        {/* Left side */}
        <div className="flex items-center gap-2">
          {/* Mobile menu trigger */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                className="group size-8 md:hidden"
                variant="ghost"
                size="icon"
              >
                <svg
                  className="pointer-events-none"
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 12L20 12"
                    className="origin-center -translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
                  />
                  <path
                    d="M4 12H20"
                    className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
                  />
                  <path
                    d="M4 12H20"
                    className="origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
                  />
                </svg>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-1 md:hidden">
              <NavigationMenu className="max-w-none *:w-full">
                <NavigationMenuList className="flex-col items-start gap-0 md:gap-2">
                  {navigationLinks.map((link, index) => (
                    <NavigationMenuItem key={index} className="w-full">
                      {link.submenu ? (
                        <>
                          <div className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
                            {link.label}
                          </div>
                          <ul>
                            {link.items?.map((item, itemIndex) => (
                              <li key={itemIndex}>
                                <NavigationMenuItem asChild className="py-1.5">
                                  <Link href={item.href || "/"}>
                                    {item.label}
                                  </Link>
                                </NavigationMenuItem>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <NavigationMenuLink href={link.href} className="py-1.5">
                          {link.label}
                        </NavigationMenuLink>
                      )}
                      {/* Add separator between different types of items */}
                      {index < navigationLinks.length - 1 &&
                        // Show separator if:
                        // 1. One is submenu and one is simple link OR
                        // 2. Both are submenus but with different types
                        ((!link.submenu &&
                          navigationLinks[index + 1]?.submenu) ||
                          (link.submenu &&
                            !navigationLinks[index + 1]?.submenu) ||
                          (link.submenu &&
                            navigationLinks[index + 1]?.submenu &&
                            link.type !==
                              navigationLinks[index + 1]?.type)) && (
                          <div
                            role="separator"
                            aria-orientation="horizontal"
                            className="bg-border -mx-1 my-1 h-px w-full"
                          />
                        )}
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </PopoverContent>
          </Popover>

          {/* Main nav */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-foreground hover:text-foreground/80 transition-colors duration-200"
            >
              <Logo />
            </Link>
            {/* Navigation menu */}
            <NavigationMenu viewport={false} className="max-md:hidden">
              <NavigationMenuList className="gap-2">
                {navigationLinks.map((link, index) => (
                  <NavigationMenuItem key={index}>
                    {link.submenu ? (
                      <>
                        <NavigationMenuTrigger className="text-muted-foreground hover:text-primary bg-transparent px-2 py-1.5 font-medium *:[svg]:-me-0.5 *:[svg]:size-3.5">
                          {link.label}
                        </NavigationMenuTrigger>
                        <NavigationMenuContent className="data-[motion=from-end]:slide-in-from-right-16! data-[motion=from-start]:slide-in-from-left-16! data-[motion=to-end]:slide-out-to-right-16! data-[motion=to-start]:slide-out-to-left-16! z-50 p-1">
                          <ul
                            className={cn(
                              link.type === "description"
                                ? "min-w-64"
                                : "min-w-48",
                            )}
                          >
                            {link.items?.map((item, itemIndex) => (
                              <li key={itemIndex}>
                                <NavigationMenuLink asChild className="py-1.5">
                                  <Link href={item.href || "#"}>
                                    {/* Display icon if present */}
                                    {link.type === "icon" && item.icon && (
                                      <div className="flex items-center gap-2">
                                        {item.icon === "BookOpenIcon" && (
                                          <BookOpenIcon
                                            size={16}
                                            className="text-foreground opacity-60"
                                            aria-hidden="true"
                                          />
                                        )}
                                        {item.icon === "LifeBuoyIcon" && (
                                          <LifeBuoyIcon
                                            size={16}
                                            className="text-foreground opacity-60"
                                            aria-hidden="true"
                                          />
                                        )}
                                        {item.icon === "InfoIcon" && (
                                          <InfoIcon
                                            size={16}
                                            className="text-foreground opacity-60"
                                            aria-hidden="true"
                                          />
                                        )}
                                        <span>{item.label}</span>
                                      </div>
                                    )}

                                    {/* Display label with description if present */}
                                    {link.type === "description" &&
                                    item.description ? (
                                      <div className="space-y-1">
                                        <div className="font-medium">
                                          {item.label}
                                        </div>
                                        <p className="text-muted-foreground line-clamp-2 text-xs">
                                          {item.description}
                                        </p>
                                      </div>
                                    ) : (
                                      // Display simple label if not icon or description type
                                      !link.type ||
                                      (link.type !== "icon" &&
                                        link.type !== "description" && (
                                          <span>{item.label}</span>
                                        ))
                                    )}
                                  </Link>
                                </NavigationMenuLink>
                              </li>
                            ))}
                          </ul>
                        </NavigationMenuContent>
                      </>
                    ) : (
                      <NavigationMenuLink
                        asChild
                        className="text-muted-foreground hover:text-primary py-1.5 font-medium"
                      >
                        <Link href={link.href || "/"}>{link.label}</Link>
                      </NavigationMenuLink>
                    )}
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
          <Button asChild variant="ghost" size="sm" className="text-sm">
            <Link href="/auth/login">{t("signIn")}</Link>
          </Button>
          <Button asChild size="sm" className="text-sm">
            <Link href="/chat">{t("getStarted")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
