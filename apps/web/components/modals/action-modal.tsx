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
import { LucideIcon } from "lucide-react";

interface ActionModalProps {
  title: string;
  description: string;
  trigger?: React.ReactNode;
  children?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    isLoading?: boolean;
    variant?: "default" | "destructive" | "outline";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  icon?: LucideIcon;
}

export function ActionModal({
  title,
  description,
  trigger,
  children,
  action,
  secondaryAction,
  icon: Icon,
}: ActionModalProps) {
  return (
    <Dialog>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="gap-3">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="size-8 rounded-sm bg-secondary border border-border flex items-center justify-center">
                <Icon className="size-4 text-primary" />
              </div>
            )}
            <DialogTitle className="display-sm text-inkStrong uppercase tracking-tight">
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-mute font-mono uppercase tracking-tight opacity-70">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {children}
        </div>

        <DialogFooter className="border-t border-border pt-4 gap-3">
          {secondaryAction && (
            <DialogClose asChild>
              <Button
                variant="outline"
                className="font-bold eyebrow text-[10px]"
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </Button>
            </DialogClose>
          )}
          {action && (
            <Button
              variant={action.variant || "default"}
              className="font-bold eyebrow text-[10px] px-6 shadow-[0_0_15px_rgba(0,217,146,0.1)]"
              onClick={action.onClick}
              disabled={action.isLoading}
            >
              {action.isLoading ? "Processing..." : action.label}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
