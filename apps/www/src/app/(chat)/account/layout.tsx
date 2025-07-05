import { ReactNode } from "react";

export const metadata = {
  title: "Account Settings",
  description: "Manage your account settings and profile",
};

interface AccountLayoutProps {
  children: ReactNode;
}

export default function AccountLayout({ children }: AccountLayoutProps) {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {children}
    </div>
  );
}