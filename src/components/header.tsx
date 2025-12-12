import { UserButton } from "@daveyplate/better-auth-ui";
import Link from "next/link";
import DeniAIIcon from "./deni-ai-icon";

export default function Header() {
  return (
    <header className="w-full fixed top-0 left-0 z-50">
      <div className="bg-accent/50 backdrop-blur-[2px] border w-2xl rounded-b-xl mx-auto p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-2">
          <Link href="/">
            <DeniAIIcon className="w-8 h-8" />
          </Link>
        </div>

        <div className="flex items-center space-x-2">
          <UserButton size="icon" />
        </div>
      </div>
    </header>
  );
}
