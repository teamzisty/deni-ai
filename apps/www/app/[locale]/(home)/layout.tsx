import React from "react";
import { Footer } from "@/components/footer";
import "../../vercel-patterns.css";

type Props = {
  children: React.ReactNode;
};

export default async function LocaleLayout({ children }: Props) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {children}

      <Footer />
    </div>
  );
}
