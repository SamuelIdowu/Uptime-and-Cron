"use client";

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import { StatusPageForm } from "./status-page-form";
import { useState, useEffect } from "react";
import { Settings2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface UpdateStatusPageModalProps {
  pageId: string;
  trigger?: React.ReactNode;
}

export function UpdateStatusPageModal({ 
  pageId,
  trigger 
}: UpdateStatusPageModalProps) {
  const [open, setOpen] = useState(false);
  const [pageData, setPageData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (open && !pageData) {
      setIsLoading(true);
      fetch(`/api/status-pages/${pageId}`)
        .then(res => res.json())
        .then(data => {
          setPageData(data);
        })
        .catch(err => {
          console.error(err);
          toast.error("Failed to load status page data");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, pageId, pageData]);

  const onDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this status page? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/status-pages/${pageId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Status page deleted");
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete status page");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon-sm" className="text-mute hover:text-inkStrong">
            <Settings2 className="size-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl bg-background border-border p-0 overflow-hidden rounded-md shadow-modal">
        <div className="flex h-full min-h-[500px]">
          {/* Sidebar */}
          <div className="w-64 bg-secondary/50 border-r border-border p-6 flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="eyebrow text-[10px] text-ink">Entity Configuration</h2>
              <p className="text-[10px] text-mute uppercase font-bold opacity-50">Status Page Settings</p>
            </div>
            
            <div className="mt-auto pt-6 border-t border-border/40">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 eyebrow text-[10px]"
                    onClick={onDelete}
                    disabled={isDeleting}
                >
                    <Trash2 className="size-3.5" />
                    {isDeleting ? "DELETING..." : "DELETE PAGE"}
                </Button>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 p-10 overflow-y-auto bg-background">
            <DialogHeader className="mb-10 text-left">
              <DialogTitle className="display-md text-inkStrong uppercase">
                Update Status Page
              </DialogTitle>
              <DialogDescription className="text-mute text-sm font-mono mt-2">
                Modify your public visibility endpoint and selected monitors.
              </DialogDescription>
            </DialogHeader>

            {isLoading ? (
                <div className="space-y-4">
                    <div className="h-20 bg-secondary/50 animate-pulse rounded-md" />
                    <div className="h-40 bg-secondary/50 animate-pulse rounded-md" />
                </div>
            ) : pageData ? (
              <StatusPageForm initialData={pageData} onSuccess={() => setOpen(false)} />
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
