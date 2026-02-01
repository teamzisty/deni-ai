import { UserButton } from "@daveyplate/better-auth-ui";
import { cookies } from "next/headers";
import Link from "next/link";
import type { AppLocale } from "@/i18n/locales";
import DeniAIIcon from "./deni-ai-icon";
import LocaleSwitcher from "./locale-switcher";

export default function Header() {
  async function changeLocaleAction(locale: AppLocale) {
    "use server";
    const store = await cookies();
    store.set("locale", locale);
  }

  return (
    <header className="w-full fixed top-0 left-0 z-50 px-4 pt-4">
      <nav className="mx-auto max-w-3xl">
        <div className="glass rounded-2xl border border-border/40 shadow-lg px-4 py-3 flex items-center justify-between animate-fade-in-down">
          {/* Logo */}
          <Link
            href="/"
            aria-label="Deni AI"
            title="Deni AI"
            className="flex items-center gap-3 group"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <DeniAIIcon className="relative w-9 h-9 text-primary transition-transform duration-300 group-hover:scale-105" />
            </div>
            <span className="font-semibold text-lg tracking-tight hidden sm:inline-block">
              Deni AI
            </span>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <LocaleSwitcher changeLocaleAction={changeLocaleAction} />
            <div className="w-px h-6 bg-border/60 hidden sm:block" />
            <UserButton size="icon" />
          </div>
        </div>
      </nav>
    </header>
  );
}
