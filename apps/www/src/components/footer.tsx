import Image from "next/image";
import Link from "next/link";
import Logo from "./logo";

export function Footer() {
  return (
    <footer className="bg-muted/50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div>
            <h3 className="font-semibold mb-4">Features</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/features/search"
                  className="hover:text-foreground hover:underline hover:underline-offset-4 transition-colors duration-200"
                >
                  Search
                </Link>
              </li>
              <li>
                <Link
                  href="/features/intellipulse"
                  className="hover:text-foreground hover:underline hover:underline-offset-4 transition-colors duration-200"
                >
                  Intellipulse
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="https://docs.deniai.app/"
                  className="hover:text-foreground hover:underline hover:underline-offset-4 transition-colors duration-200"
                >
                  Docs
                </Link>
              </li>
              <li>
                <Link
                  href="https://docs.deniai.app/docs/getting-started"
                  className="hover:text-foreground hover:underline hover:underline-offset-4 transition-colors duration-200"
                >
                  Getting Started
                </Link>
              </li>
              <li>
                <Link
                  href="https://docs.deniai.app/blog/"
                  className="hover:text-foreground hover:underline hover:underline-offset-4 transition-colors duration-200"
                >
                  Changelog
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">More</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/more/student"
                  className="hover:text-foreground hover:underline hover:underline-offset-4 transition-colors duration-200"
                >
                  Student
                </Link>
              </li>
              <li>
                <Link
                  href="/more/contributors"
                  className="hover:text-foreground hover:underline hover:underline-offset-4 transition-colors duration-200"
                >
                  Contributors
                </Link>
              </li>
              <li>
                <Link
                  href="/more/contact"
                  className="hover:text-foreground hover:underline hover:underline-offset-4 transition-colors duration-200"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/more/partners"
                  className="hover:text-foreground hover:underline hover:underline-offset-4 transition-colors duration-200"
                >
                  Partners
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/legal/privacy-policy"
                  className="hover:text-foreground hover:underline hover:underline-offset-4 transition-colors duration-200"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/terms-of-service"
                  className="hover:text-foreground hover:underline hover:underline-offset-4 transition-colors duration-200"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Team</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="https://team.deniai.app/"
                  className="hover:text-foreground hover:underline hover:underline-offset-4 transition-colors duration-200"
                >
                  Home Page
                </Link>
              </li>
              <li>
                <Link
                  href="https://team.deniai.app/contact"
                  className="hover:text-foreground hover:underline hover:underline-offset-4 transition-colors duration-200"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="https://team.deniai.app/projects"
                  className="hover:text-foreground hover:underline hover:underline-offset-4 transition-colors duration-200"
                >
                  Projects
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-8 pt-8 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Logo className="h-8 w-8" />
            <span className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Veltrix.
            </span>
          </div>
          <div className="flex space-x-4">
            <span className="text-sm text-muted-foreground hover:text-foreground hover:underline hover:underline-offset-4 transition-colors duration-200">
              <Link href="https://status.deniai.app/">Status</Link>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
