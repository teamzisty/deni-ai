import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { FlixaBanner } from "@/components/flixa-banner";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.session) {
    redirect("/auth/sign-in");
  }
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <FlixaBanner />
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
