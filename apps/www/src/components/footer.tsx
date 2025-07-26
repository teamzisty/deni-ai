import Image from "next/image";
import { Link } from "@/i18n/navigation";
import Logo from "./logo";
import { useTranslations } from "@/hooks/use-translations";

export function Footer() {
  const t = useTranslations('footer');
  return (
    <footer className="bg-muted/50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div>
            <h3 className="font-semibold mb-4">{t('features')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/features/search"
                  className="hover:text-foreground hover:underline hover:underline-offset-4 transition-colors duration-200"
                >
                  {t('search')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">{t('resources')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="https://docs.deniai.app/"
                  className="hover:text-foreground hover:underline hover:underline-offset-4 transition-colors duration-200"
                >
                  {t('docs')}
                </Link>
              </li>
              <li>
                <Link
                  href="https://docs.deniai.app/docs/getting-started"
                  className="hover:text-foreground hover:underline hover:underline-offset-4 transition-colors duration-200"
                >
                  {t('gettingStarted')}
                </Link>
              </li>
              <li>
                <Link
                  href="https://docs.deniai.app/blog/"
                  className="hover:text-foreground hover:underline hover:underline-offset-4 transition-colors duration-200"
                >
                  {t('changelog')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">{t('more')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/more/student"
                  className="hover:text-foreground hover:underline hover:underline-offset-4 transition-colors duration-200"
                >
                  {t('student')}
                </Link>
              </li>
              <li>
                <Link
                  href="/more/contributors"
                  className="hover:text-foreground hover:underline hover:underline-offset-4 transition-colors duration-200"
                >
                  {t('contributors')}
                </Link>
              </li>
              <li>
                <Link
                  href="/more/contact"
                  className="hover:text-foreground hover:underline hover:underline-offset-4 transition-colors duration-200"
                >
                  {t('contact')}
                </Link>
              </li>
              <li>
                <Link
                  href="/more/partners"
                  className="hover:text-foreground hover:underline hover:underline-offset-4 transition-colors duration-200"
                >
                  {t('partners')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">{t('legal')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/legal/privacy-policy"
                  className="hover:text-foreground hover:underline hover:underline-offset-4 transition-colors duration-200"
                >
                  {t('privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/terms-of-service"
                  className="hover:text-foreground hover:underline hover:underline-offset-4 transition-colors duration-200"
                >
                  {t('termsOfService')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">{t('team')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="https://team.deniai.app/"
                  className="hover:text-foreground hover:underline hover:underline-offset-4 transition-colors duration-200"
                >
                  {t('homePage')}
                </Link>
              </li>
              <li>
                <Link
                  href="https://team.deniai.app/contact"
                  className="hover:text-foreground hover:underline hover:underline-offset-4 transition-colors duration-200"
                >
                  {t('contact')}
                </Link>
              </li>
              <li>
                <Link
                  href="https://team.deniai.app/projects"
                  className="hover:text-foreground hover:underline hover:underline-offset-4 transition-colors duration-200"
                >
                  {t('projects')}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-8 pt-8 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Logo className="h-8 w-8" />
            <span className="text-sm text-muted-foreground">
              {t('copyright', { year: new Date().getFullYear() })}
            </span>
          </div>
          <div className="flex space-x-4">
            <span className="text-sm text-muted-foreground hover:text-foreground hover:underline hover:underline-offset-4 transition-colors duration-200">
              <Link href="https://status.deniai.app/">{t('status')}</Link>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
