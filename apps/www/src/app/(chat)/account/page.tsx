import { Metadata } from "next";
import { AccountSettings } from "@/components/account/AccountSettings";

export const metadata: Metadata = {
  title: "Account Settings",
  description: "Manage your account settings and profile",
};

export default function AccountPage() {
  return <AccountSettings />;
}
