import { DocsSidebar } from "@/components/docs-sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <DocsSidebar />
      {children}
    </div>
  );
}
