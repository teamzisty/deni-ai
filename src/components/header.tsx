import { UserButton } from "@daveyplate/better-auth-ui";
import { cookies } from "next/headers";
import Link from "next/link";
import type { AppLocale } from "@/i18n/locales";
import DeniAIIcon from "./deni-ai-icon";
import { LocaleSwitcher } from "./locale-switcher";

export default function Header() {
  async function changeLocaleAction(locale: AppLocale) {
    "use server";
    const store = await cookies();
    store.set("locale", locale);
  }

  return (
    <header className="w-full fixed top-0 left-0 z-50 px-4 pt-4">
      <nav className="mx-auto max-w-3xl">
        <div className="rounded-lg border border-border bg-background/90 backdrop-blur-sm shadow-sm px-4 py-2.5 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            aria-label="Deni AI"
            title="Deni AI"
            className="flex items-center gap-2.5"
          >
            <DeniAIIcon className="w-7 h-7 text-foreground" />
            <span className="font-semibold text-base tracking-tight hidden sm:inline-block">
              Deni AI
            </span>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <LocaleSwitcher changeLocaleAction={changeLocaleAction} />
            <div className="w-px h-5 bg-border hidden sm:block" />
            <UserButton size="icon" />
          </div>
        </div>
      </nav>
    </header>
  );
}
