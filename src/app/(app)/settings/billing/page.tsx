import dynamic from "next/dynamic";

const BillingPage = dynamic(
  () => import("@/components/billing/billing-page").then((mod) => mod.BillingPage),
  {
    loading: () => (
      <div className="flex min-h-[60vh] w-full items-center justify-center text-sm text-muted-foreground">
        Loading billing…
      </div>
    ),
  },
);

export default function BillingSettingsPage() {
  return <BillingPage />;
}
