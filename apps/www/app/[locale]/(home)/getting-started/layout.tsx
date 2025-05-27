import { ChatSessionsProvider } from "@/hooks/use-chat-sessions";
import { ReactNode } from "react";

interface GettingStartedLayoutProps {
  children: ReactNode;
}

export default function GettingStartedLayout({
  children,
}: GettingStartedLayoutProps) {
  return <ChatSessionsProvider>{children}</ChatSessionsProvider>;
}
