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
    <header className="w-full fixed top-0 left-0 z-50">
      <div className="bg-accent/50 backdrop-blur-[2px] border w-2xl rounded-b-xl mx-auto p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-2">
          <Link href="/">
            <DeniAIIcon className="w-8 h-8" />
          </Link>
        </div>

        <div className="flex items-center space-x-2">
          <LocaleSwitcher changeLocaleAction={changeLocaleAction} />
          <UserButton size="icon" />
        </div>
      </div>
    </header>
  );
}
