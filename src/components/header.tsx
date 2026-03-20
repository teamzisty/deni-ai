import { UserButton } from "@daveyplate/better-auth-ui";
import {
  Bot,
  BookOpen,
  ChevronDown,
  FileText,
  Globe,
  Laptop,
  Shield,
  Sparkles,
} from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { useExtracted } from "next-intl";
import type { AppLocale } from "@/i18n/locales";
import DeniAIIcon from "./deni-ai-icon";
import { LocaleSwitcher } from "./locale-switcher";

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

function MegaMenu({
  label,
  sections,
}: {
  label: string;
  sections: MegaMenuSection[];
}) {
  return (
    <div className="group/menu relative">
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/75 px-4 py-2 text-sm font-medium text-white/88 transition-colors hover:border-white/20 hover:bg-black"
      >
        <span>{label}</span>
        <ChevronDown className="h-3.5 w-3.5 text-white/55 transition-transform duration-200 group-hover/menu:rotate-180" />
      </button>

      <div className="pointer-events-none absolute left-0 top-full pt-3 opacity-0 transition duration-200 group-hover/menu:pointer-events-auto group-hover/menu:opacity-100 group-focus-within/menu:pointer-events-auto group-focus-within/menu:opacity-100">
        <div className="w-[min(88vw,760px)] rounded-xl border border-white/10 bg-[#050505]/96 p-4 text-white shadow-[0_32px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div className="grid gap-8 md:grid-cols-3">
            {sections.map((section) => (
              <div key={section.title}>
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.24em] text-white/38">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.links.map((link) => {
                    const Icon = link.icon;

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="grid grid-cols-[2.125rem_minmax(0,1fr)] items-center gap-4 rounded-md border border-white/0 px-1 py-1 transition-colors hover:border-white/10 hover:bg-white/[0.04]"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
                          <Icon className="h-5 w-5 text-white/80" />
                        </span>
                        <span className="flex min-w-0 flex-col gap-1 justify-center self-center">
                          <span className="block text-sm font-semibold tracking-tight text-white">
                            {link.title}
                          </span>
                          <span className="block text-xs text-white/56">
                            {link.description}
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

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

  const mobileLinks = productSections.flatMap((section) =>
    section.links.map((link) => ({
      href: link.href,
      category: section.title,
      title: link.title,
    })),
  );

  return (
    <header className="fixed left-0 top-0 z-50 w-full px-4 pt-4">
      <nav className="mx-auto max-w-6xl">
        <div className="rounded-[1.35rem] border border-white/10 bg-black/72 px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              aria-label="Deni AI"
              title="Deni AI"
              className="flex items-center gap-3"
            >
              <DeniAIIcon className="h-7 w-7 text-white" />
              <span className="hidden text-base font-semibold tracking-tight text-white sm:inline-block">
                Deni AI
              </span>
            </Link>

            <div className="hidden min-w-0 flex-1 items-center justify-center gap-3 lg:flex">
              <MegaMenu label={t("Products")} sections={productSections} />
              <MegaMenu label={t("Resources")} sections={resourceSections} />
              <Link
                href="/about"
                className="rounded-full px-4 py-2 text-sm font-medium text-white/72 transition-colors hover:text-white"
              >
                {t("About")}
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <LocaleSwitcher changeLocaleAction={changeLocaleAction} />
              <div className="hidden h-5 w-px bg-white/10 sm:block" />
              <UserButton size="icon" />
            </div>
          </div>

          <div className="mt-3 border-t border-white/10 pt-3 lg:hidden">
            <div className="flex flex-wrap gap-2">
              {mobileLinks.map((item) => (
                <Link
                  key={`${item.category}-${item.href}`}
                  href={item.href}
                  className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5 transition-colors hover:border-white/20 hover:bg-white/[0.06] sm:flex-none"
                >
                  <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-white/40">
                    {item.category}
                  </span>
                  <span className="mt-1 block text-sm font-medium leading-tight text-white">
                    {item.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
