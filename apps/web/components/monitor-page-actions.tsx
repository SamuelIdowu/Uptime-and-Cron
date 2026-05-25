"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface MonitorPageActionsProps {
  monitorId: string;
  workspaceId: string;
  isPaused: boolean;
}

export function MonitorPageActions({ monitorId, workspaceId, isPaused }: MonitorPageActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onTogglePause = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/monitors/${monitorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paused: !isPaused }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to toggle status");
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      window.alert(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button 
        size="sm" 
        variant="outline" 
        className="transition-all uppercase eyebrow text-[10px]"
        onClick={onTogglePause}
        disabled={isLoading}
      >
        {isPaused ? "Resume Monitor" : "Pause Monitor"}
      </Button>
      <Link href={`/${workspaceId}/monitors/${monitorId}/edit`}>
        <Button size="sm" className="transition-all uppercase eyebrow text-[10px]">
          Edit Monitor
        </Button>
      </Link>
    </div>
  );
}
