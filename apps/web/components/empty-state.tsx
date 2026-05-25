"use client";

import { LucideIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-card border border-border rounded-md",
        className
      )}
    >
      <div className="relative mb-4">
        <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
        <div className="relative size-12 rounded-sm bg-secondary border border-border flex items-center justify-center">
          <Icon className="size-6 text-primary" />
        </div>
      </div>
      
      <h3 className="display-sm text-inkStrong uppercase mb-1.5">{title}</h3>
      <p className="text-xs text-mute max-w-xs mb-6 font-mono uppercase tracking-tight">
        {description}
      </p>

      {action && (
        <Button 
          onClick={action.onClick}
          className="gap-2 eyebrow text-[10px] px-6 shadow-[0_0_10px_rgba(0,217,146,0.2)]"
        >
          {action.icon ? <action.icon className="size-3.5" /> : <Plus className="size-3.5" />}
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}
