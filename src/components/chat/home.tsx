"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Composer, type ComposerMessage } from "@/components/chat/composer";

export default function ChatHome() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [webSearch, setWebSearch] = useState(false);

  const handleSubmit = (message: ComposerMessage) => {
    if (message.text.trim()) {
      // Pass message and webSearch as query params or just path
      // Currently /new/[message] takes only message.
      // To support webSearch from home, we might need to update /new route or just pass it.
      // For now just message.
      router.push(`/new/${encodeURIComponent(message.text)}`);
    }
  };

  return (
    <main className="flex min-h-screen flex-col gap-8 items-center justify-center text-center p-4">
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tighter">
        Hello, How can I help you today?
      </h1>

      <div className="w-full max-w-2xl text-left">
        <Composer
          onSubmit={handleSubmit}
          className="w-full border rounded-xl p-4 bg-background shadow-sm"
          globalDrop
          multiple
          value={input}
          onValueChange={(value) => setInput(value)}
          placeholder="Ask me anything..."
          textareaClassName="min-h-[60px]"
          webSearch={webSearch}
          onToggleWebSearch={() => setWebSearch(!webSearch)}
        />
      </div>
    </main>
  );
}
