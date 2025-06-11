import Link from "next/link";
import {
  SiRefinedgithub,
  SiX,
  SiDiscord,
} from "@icons-pack/react-simple-icons";

export function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
        <div className="flex justify-center space-x-6 md:order-2">
          <Link
            href="https://github.com/raicdev/deni-ai"
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="sr-only">GitHub</span>
            <SiRefinedgithub className="h-6 w-6" />
          </Link>
          <Link
            href="https://x.com/deniaiapp"
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <span className="sr-only">X</span>
            <SiX className="h-6 w-6" />
          </Link>
          <Link
            href="#"
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <span className="sr-only">Discord</span>
            <SiDiscord className="h-6 w-6" />
          </Link>
        </div>
        <div className="mt-8 md:order-1 md:mt-0">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-6">
            <p className="text-center text-xs leading-5 text-gray-500 dark:text-gray-400">
              &copy; 2025 Veltrix. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0 flex justify-center space-x-6">
              <Link
                href="/privacy"
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
