import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.session) {
    redirect("/auth/sign-in");
  }
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-8 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
