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
import { useState } from "react";
import { FileText, Globe } from "lucide-react";

interface CreateStatusPageModalProps {
  trigger?: React.ReactNode;
}

export function CreateStatusPageModal({ 
  trigger 
}: CreateStatusPageModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button className="hidden" />
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl bg-background border-border p-0 overflow-hidden rounded-md shadow-modal">
        <div className="flex h-full min-h-[500px]">
          {/* Sidebar */}
          <div className="w-64 bg-secondary/50 border-r border-border p-6 flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="eyebrow text-[10px] text-ink">Entity Provisioning</h2>
              <p className="text-[10px] text-mute uppercase font-bold opacity-50">Public Status Interface</p>
            </div>
            
            <div className="p-4 bg-secondary rounded-sm border border-border">
              <div className="flex items-center gap-2 mb-2 text-primary">
                <Globe className="size-4" />
                <span className="eyebrow text-[9px]">Edge Network</span>
              </div>
              <p className="text-[10px] text-mute leading-relaxed font-mono">
                Status pages provide global transparency for your infrastructure health. Changes are propagated to edge nodes in real-time.
              </p>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 p-10 overflow-y-auto bg-background">
            <DialogHeader className="mb-10 text-left">
              <DialogTitle className="display-md text-inkStrong uppercase">
                New Status Page
              </DialogTitle>
              <DialogDescription className="text-mute text-sm font-mono mt-2">
                Configure your public visibility endpoint. Select monitors to display.
              </DialogDescription>
            </DialogHeader>

            <StatusPageForm onSuccess={() => setOpen(false)} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
