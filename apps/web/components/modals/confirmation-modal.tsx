"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LucideIcon, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmationModalProps {
  title: string;
  description: string;
  trigger?: React.ReactNode;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "default";
  icon?: LucideIcon;
  isLoading?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ConfirmationModal({
  title,
  description,
  trigger,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  icon: Icon = AlertTriangle,
  isLoading = false,
  open,
  onOpenChange,
}: ConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader className="flex flex-col items-center text-center gap-4">
          <div className={cn(
            "size-12 rounded-sm border flex items-center justify-center",
            variant === "destructive" ? "bg-status-down/10 border-status-down/20 text-status-down" : "bg-primary/10 border-primary/20 text-primary"
          )}>
            <Icon className="size-6" />
          </div>
          <div className="space-y-1">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </div>
        </DialogHeader>
        <DialogFooter className="sm:justify-center gap-2 pt-4">
          <DialogClose asChild>
            <Button
              variant="outline"
              className="font-bold eyebrow text-[10px] flex-1 sm:flex-none"
            >
              {cancelText}
            </Button>
          </DialogClose>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            className="font-bold eyebrow text-[10px] flex-1 sm:flex-none shadow-[0_0_10px_rgba(0,0,0,0.1)]"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
