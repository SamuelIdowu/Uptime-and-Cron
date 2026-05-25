import { ShieldAlert, ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PlanLimitBannerProps {
  current: number;
  max: number;
  plan: string;
}

export function PlanLimitBanner({ current, max, plan }: PlanLimitBannerProps) {
  const percentage = Math.min(100, (current / max) * 100);
  const isNearLimit = percentage >= 80;

  if (!isNearLimit) return null;

  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
          <ShieldAlert className="size-5 text-amber-500" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-amber-200">
            You&apos;ve used {current} of {max} monitors on the {plan} plan.
          </p>
          <div className="h-1.5 w-48 bg-muted rounded-full overflow-hidden">
            <div 
                className="h-full bg-amber-500 transition-all duration-500" 
                style={{ width: `${percentage}%` }} 
            />
          </div>
        </div>
      </div>
      <Link href="/settings">
        <Button size="sm" variant="outline" className="gap-2 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20 text-amber-200">
          <ArrowUpCircle className="size-4" />
          Upgrade Plan
        </Button>
      </Link>
    </div>
  );
}
