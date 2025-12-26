import { LoginButton } from "@/components/login-button";
import { Badge } from "@/components/ui/badge";

export default async function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center text-center">
      <Badge className="mb-4 px-3 py-1 text-sm">Welcome to Deni AI</Badge>
      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter">
        AI Chatbot for
        <div className="bg-secondary w-fit px-2 block mx-auto rounded">
          <span className="block decoration-primary decoration-4 bg-linear-to-r from-foreground/50 via-foreground/80 to-foreground bg-clip-text text-transparent tracking-tighter">
            Everyone
          </span>
        </div>
      </h1>
      <p className="mt-6 text-lg md:text-xl max-w-2xl text-muted-foreground mb-6">
        Deni AI is an AI chat app created for everyone (those who can't afford
        to spend money). You can use the latest AI models for free.
      </p>

      <LoginButton />
    </main>
  );
}
