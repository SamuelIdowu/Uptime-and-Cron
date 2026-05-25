import { Sidebar } from "@/components/sidebar";
import { UserButton } from "@clerk/nextjs";
import { Activity, Menu, Zap } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar workspaceId={workspaceId} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="sm:hidden flex items-center justify-between p-3 border-b border-border bg-background sticky top-0 z-30">
          <Link href={`/${workspaceId}/dashboard`} className="flex items-center gap-2">
            <div className="size-7 rounded-sm bg-primary flex items-center justify-center">
              <Zap className="size-3.5 text-primary-foreground" />
            </div>
            <h1 className="text-base font-bold tracking-tight text-foreground font-sans uppercase">SteadyState</h1>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserButton appearance={{ elements: { userButtonAvatarBox: "size-7 rounded-sm border border-border" } }} />
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
