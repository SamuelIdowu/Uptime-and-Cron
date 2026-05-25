"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface HeartbeatPageActionsProps {
  heartbeatId: string;
  workspaceId: string;
  isPaused: boolean;
}

export function HeartbeatPageActions({ heartbeatId, workspaceId, isPaused }: HeartbeatPageActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onTogglePause = async () => {
    setIsLoading(true);
    try {
      await fetch(`/api/heartbeats/${heartbeatId}`, {
        method: "PATCH",
        body: JSON.stringify({ paused: !isPaused }),
      });
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button 
        size="sm" 
        variant="outline" 
        className="rounded-none border-border shadow-sm font-medium"
        onClick={onTogglePause}
        disabled={isLoading}
      >
        {isPaused ? "Resume" : "Pause"}
      </Button>
      <Link href={`/${workspaceId}/heartbeats/${heartbeatId}/edit`}>
        <Button size="sm" variant="outline" className="rounded-none border-border shadow-sm font-medium">Edit</Button>
      </Link>
    </div>
  );
}
