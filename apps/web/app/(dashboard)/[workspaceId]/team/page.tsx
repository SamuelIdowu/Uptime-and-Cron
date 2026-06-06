"use client";

import { useParams } from "next/navigation";
import { Users } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export default function TeamPlaceholder() {
  const { workspaceId } = useParams();

  return (
    <main className="min-h-screen p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-6">
          <div className="flex flex-col gap-0.5">
            <h1 className="display-lg text-inkStrong uppercase">Team</h1>
            <p className="text-mute text-xs font-mono">Manage operator permissions and access.</p>
          </div>
        </div>

        <section className="flex items-center justify-center py-12 sm:py-20">
          <EmptyState 
            icon={<Users className="size-6" />}
            title="Access Control"
            description="Multi-user collaboration and role-based access control are currently in security audit. Enrollment will open in the next sprint."
            className="max-w-md w-full"
          />
        </section>
      </div>
    </main>
  );
}
