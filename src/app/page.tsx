import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Deni AI",
  description: "Chat with multiple AI models in one workspace.",
};

export default function RootPage() {
  permanentRedirect("/home");
}
