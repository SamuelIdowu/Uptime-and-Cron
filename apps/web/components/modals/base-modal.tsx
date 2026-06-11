"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface BaseModalProps {
  title: string;
  description?: string;
  trigger?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function BaseModal({
  title,
  description,
  trigger,
  children,
  className,
  maxWidth = "md",
  open,
  onOpenChange,
}: BaseModalProps) {
  const maxWidthClasses = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    "2xl": "sm:max-w-2xl",
    "3xl": "sm:max-w-3xl",
    "4xl": "sm:max-w-4xl",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className={cn(maxWidthClasses[maxWidth], "overflow-hidden p-0", className)}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border bg-secondary/30">
            <DialogHeader>
              <DialogTitle className="display-sm text-inkStrong uppercase tracking-tight">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-xs text-mute font-mono uppercase tracking-tight opacity-70 mt-1">
                  {description}
                </DialogDescription>
              )}
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto p-6 bg-background">
            {children}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
