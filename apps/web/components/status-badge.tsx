import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-pill px-2 py-0.5 eyebrow text-[9px] border transition-colors",
  {
    variants: {
      status: {
        up: "bg-primary/10 text-primary border-primary/20",
        down: "bg-destructive/10 text-destructive border-destructive/20",
        late: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        paused: "bg-secondary text-mute border-border",
        pending: "bg-secondary text-ink border-border",
      },
    },
    defaultVariants: {
      status: "up",
    },
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  children?: React.ReactNode;
}

export function StatusBadge({ className, status, children, ...props }: StatusBadgeProps) {
  return (
    <div className={cn(statusBadgeVariants({ status }), className)} {...props}>
      {children || status}
    </div>
  )
}
