import { AccountView } from "@daveyplate/better-auth-ui";
import { accountViewPaths } from "@daveyplate/better-auth-ui/server";
import Footer from "@/components/footer";
import Header from "@/components/header";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(accountViewPaths).map((path) => ({ path }));
}

export default async function AccountPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = await params;

  return (
    <main className="pt-24 px-8" id="main-content">
      <Header />
      <AccountView path={path} />
      <Footer />
    </main>
  );
}
