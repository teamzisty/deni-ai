import { BillingPage } from "@/components/billing/billing-page";

type BillingSettingsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function BillingSettingsPage({
  searchParams,
}: BillingSettingsPageProps) {
  return <BillingPage />;
}
