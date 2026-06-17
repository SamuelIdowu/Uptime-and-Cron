import { auth } from "@clerk/nextjs/server";
import { db, statusPages, StatusPage } from "@steady-state/db";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { FileText, Plus, ExternalLink, Globe, Settings2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { CreateStatusPageModal } from "@/components/create-status-page-modal";
import { UpdateStatusPageModal } from "@/components/update-status-page-modal";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export default async function StatusPagesPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const pages = await db
    .select()
    .from(statusPages)
    .where(eq(statusPages.userId, userId))
    .orderBy(desc(statusPages.createdAt));

  return (
    <main className="min-h-screen p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-6">
          <div className="flex flex-col gap-0.5">
            <h1 className="display-lg text-inkStrong uppercase tracking-tight">Status Pages</h1>
            <p className="text-mute text-xs font-mono uppercase tracking-widest">Public visibility for your global nodes.</p>
          </div>
          <CreateStatusPageModal 
            trigger={
              <Button size="sm" className="eyebrow text-[10px] gap-2 px-6 h-10 shadow-[0_0_15px_rgba(0,217,146,0.1)]">
                <Plus className="size-3" />
                Provision Page
              </Button>
            }
          />
        </div>

        {pages.length === 0 ? (
          <section className="flex items-center justify-center py-12 sm:py-20">
            <EmptyState 
              icon={<FileText className="size-6" />}
              title="No Status Pages"
              description="Create a public status page to showcase your system reliability to your users."
              className="max-w-md w-full"
              action={
                <CreateStatusPageModal 
                  trigger={
                    <Button variant="outline" size="sm" className="eyebrow text-[10px] gap-2 mt-4">
                      <Plus className="size-3" />
                      Create your first page
                    </Button>
                  }
                />
              }
            />
          </section>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map((page: StatusPage) => (
              <div 
                key={page.id}
                className="group relative flex flex-col bg-card border border-border rounded-md p-6 transition-all hover:border-primary hover:shadow-[0_0_20px_rgba(0,217,146,0.02)]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                        "size-10 rounded-md flex items-center justify-center ring-1 ring-border bg-secondary/50",
                        page.published ? "text-primary ring-primary/20" : "text-mute"
                    )}>
                      <Globe className="size-5" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="font-bold text-inkStrong uppercase tracking-tight group-hover:text-primary transition-colors">
                        {page.name}
                      </h3>
                      <span className="text-[9px] font-mono text-mute uppercase tracking-tighter">
                        /{page.slug}
                      </span>
                    </div>
                  </div>
                  <div className={cn(
                    "px-2 py-0.5 rounded-[2px] text-[8px] font-black uppercase tracking-widest border",
                    page.published 
                        ? "bg-primary/10 text-primary border-primary/20" 
                        : "bg-secondary text-mute border-border"
                  )}>
                    {page.published ? "Live" : "Draft"}
                  </div>
                </div>

                <p className="text-xs text-mute line-clamp-2 mb-6 font-mono leading-relaxed h-8">
                  {page.description || "No description provided."}
                </p>

                <div className="mt-auto pt-6 border-t border-border/40 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase tracking-widest text-mute/40">Created</span>
                    <span className="text-[10px] font-bold text-ink font-mono uppercase">
                        {formatDistanceToNow(new Date(page.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Link href={`/status/${page.slug}`} target="_blank">
                        <Button variant="ghost" size="icon-sm" className="text-mute hover:text-primary" title="View Public Page">
                            <ExternalLink className="size-4" />
                        </Button>
                    </Link>
                    <UpdateStatusPageModal pageId={page.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
