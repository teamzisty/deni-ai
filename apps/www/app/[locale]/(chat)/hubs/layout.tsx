import { ReactNode } from "react";

interface HubsLayoutProps {
  children: ReactNode;
}

export default function HubsLayout({ children }: HubsLayoutProps) {
  return (
    <main className="flex-1 overflow-auto">
      {children}
    </main>
  );
}