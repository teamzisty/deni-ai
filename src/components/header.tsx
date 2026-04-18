import { UserButton } from "@daveyplate/better-auth-ui";
import {
  Bot,
  BookOpen,
  BriefcaseBusiness,
  FileText,
  Globe,
  Laptop,
  Menu,
  Shield,
  Sparkles,
} from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { useExtracted } from "next-intl";
import type { AppLocale } from "@/i18n/locales";
import DeniAIIcon from "./deni-ai-icon";
import { HeaderMegaMenu } from "./header-mega-menu";
import { LocaleSwitcher } from "./locale-switcher";
import { Button, buttonVariants } from "./ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

type MegaMenuLink = {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
};

type MegaMenuSection = {
  title: string;
  links: MegaMenuLink[];
};

export default function Header() {
  const t = useExtracted();

  async function changeLocaleAction(nextLocale: AppLocale) {
    "use server";
    const store = await cookies();
    store.set("locale", nextLocale);
  }

  const productSections: MegaMenuSection[] = [
    {
      title: t("Chat Platform"),
      links: [
        {
          href: "/home",
          icon: Bot,
          title: "Deni AI",
          description: t("Chat with multiple AI models."),
        },
        {
          href: "/models",
          icon: Sparkles,
          title: t("AI Models"),
          description: t("Supported models."),
        },
      ],
    },
    {
      title: t("Creative Tools"),
      links: [
        {
          href: "/desktop",
          icon: Laptop,
          title: t("Desktop"),
          description: t("Desktop app."),
        },
        {
          href: "/migration",
          icon: FileText,
          title: t("Migration"),
          description: t("Move your chats."),
        },
      ],
    },
    {
      title: t("Extensions"),
      links: [
        {
          href: "/flixa",
          icon: Globe,
          title: "Flixa",
          description: t("AI coding agent."),
        },
      ],
    },
  ];

  const resourceSections: MegaMenuSection[] = [
    {
      title: t("Company"),
      links: [
        {
          href: "/about",
          icon: BookOpen,
          title: t("About"),
          description: t("Vision and background."),
        },
        {
          href: "/use-cases",
          icon: BriefcaseBusiness,
          title: t("Use Cases"),
          description: t("Practical workflows."),
        },
      ],
    },
    {
      title: t("Legal"),
      links: [
        {
          href: "/legal/terms",
          icon: FileText,
          title: t("Terms"),
          description: t("Terms of service."),
        },
        {
          href: "/legal/privacy-policy",
          icon: Shield,
          title: t("Privacy"),
          description: t("Data handling policy."),
        },
      ],
    },
  ];

  const mobileSections = [...productSections, ...resourceSections];

  return (
    <header className="fixed left-0 top-0 z-50 w-full px-4 pt-4">
      <nav className="mx-auto max-w-6xl">
        <div className="rounded-[1.35rem] border border-white/10 bg-black/72 px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" aria-label="Deni AI" title="Deni AI" className="flex items-center gap-3">
              <DeniAIIcon className="h-7 w-7 text-white" />
              <span className="hidden text-base font-semibold tracking-tight text-white sm:inline-block">
                Deni AI
              </span>
            </Link>

            <div className="hidden min-w-0 flex-1 items-center justify-center gap-3 lg:flex">
              <HeaderMegaMenu label={t("Products")} menuLabel={t("Products")}>
                <div className="grid gap-8 md:grid-cols-3">
                  {productSections.map((section) => (
                    <div key={section.title}>
                      <p className="mb-2 text-sm text-muted-foreground font-medium">
                        {section.title}
                      </p>
                      <div className="space-y-1">
                        {section.links.map((link) => {
                          const Icon = link.icon;

                          return (
                            <Button
                              key={link.href}
                              variant="ghost"
                              className="w-full h-full justify-start px-2!"
                              asChild
                            >
                              <Link href={link.href} role="menuitem">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border">
                                  <Icon className="h-5 w-5 text-white/80" />
                                </span>
                                <span className="flex min-w-0 flex-col gap-0.5 justify-center self-center">
                                  <span className="block text-sm font-semibold tracking-tight">
                                    {link.title}
                                  </span>
                                  <span className="block text-xs text-primary/70">
                                    {link.description}
                                  </span>
                                </span>
                              </Link>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </HeaderMegaMenu>
              <HeaderMegaMenu label={t("Resources")} menuLabel={t("Resources")}>
                <div className="grid gap-8 md:grid-cols-3">
                  {resourceSections.map((section) => (
                    <div key={section.title}>
                      <p className="mb-2 text-sm text-muted-foreground font-medium">
                        {section.title}
                      </p>
                      <div className="space-y-1">
                        {section.links.map((link) => {
                          const Icon = link.icon;

                          return (
                            <Button
                              key={link.href}
                              variant="ghost"
                              className="w-full h-full justify-start px-2!"
                              asChild
                            >
                              <Link href={link.href} role="menuitem">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border">
                                  <Icon className="h-5 w-5 text-white/80" />
                                </span>
                                <span className="flex min-w-0 flex-col gap-0.5 justify-center self-center">
                                  <span className="block text-sm font-semibold tracking-tight">
                                    {link.title}
                                  </span>
                                  <span className="block text-xs text-primary/70">
                                    {link.description}
                                  </span>
                                </span>
                              </Link>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </HeaderMegaMenu>
              <Link
                href="/about"
                className="rounded-full px-4 py-2 text-sm font-medium text-white/72 transition-colors hover:text-white"
              >
                {t("About")}
              </Link>
            </div>

            <div className="hidden items-center gap-2 lg:flex">
              <LocaleSwitcher changeLocaleAction={changeLocaleAction} />
              <div className="hidden h-5 w-px bg-white/10 sm:block" />
              <UserButton size="icon" />
            </div>

            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger
                  className={buttonVariants({
                    variant: "outline",
                    size: "icon",
                    className:
                      "rounded-full border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08]",
                  })}
                  aria-label={t("Open menu")}
                >
                  <Menu className="h-5 w-5" />
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="border-white/10 bg-[#050505]/96 px-0 text-white backdrop-blur-xl"
                >
                  <SheetHeader className="border-b border-white/10 px-5 py-5 text-left">
                    <SheetTitle className="text-base text-white">{t("Menu")}</SheetTitle>
                    <SheetDescription className="text-white/60">
                      {t("Browse products, resources, language, and account options.")}
                    </SheetDescription>
                  </SheetHeader>

                  <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-5">
                    <div className="space-y-6">
                      {mobileSections.map((section) => (
                        <div key={section.title} className="space-y-2">
                          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/40">
                            {section.title}
                          </p>
                          <div className="space-y-2">
                            {section.links.map((link) => {
                              const Icon = link.icon;

                              return (
                                <SheetClose asChild key={`${section.title}-${link.href}`}>
                                  <Button
                                    variant="ghost"
                                    className="h-auto w-full justify-start rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left text-white hover:bg-white/[0.08]"
                                    asChild
                                  >
                                    <Link href={link.href}>
                                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                                        <Icon className="h-5 w-5 text-white/80" />
                                      </span>
                                      <span className="flex min-w-0 flex-col">
                                        <span className="text-sm font-medium leading-tight">
                                          {link.title}
                                        </span>
                                        <span className="text-xs text-white/60">
                                          {link.description}
                                        </span>
                                      </span>
                                    </Link>
                                  </Button>
                                </SheetClose>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 border-t border-white/10 pt-6">
                      <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-white/40">
                        {t("Language")}
                      </p>
                      <LocaleSwitcher changeLocaleAction={changeLocaleAction} />
                    </div>

                    <div className="mt-6 border-t border-white/10 pt-6">
                      <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-white/40">
                        {t("Account")}
                      </p>
                      <div className="flex items-center justify-start">
                        <UserButton />
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
