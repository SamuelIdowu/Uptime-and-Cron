"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";

interface AcceptInviteButtonProps {
  token: string;
}

export function AcceptInviteButton({ token }: AcceptInviteButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onAccept = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/invitations/${token}/accept`, {
        method: "POST",
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to accept invitation");
      }

      const { workspaceId } = await res.json();
      
      // Redirect to the workspace dashboard
      router.push(`/${workspaceId}/dashboard`);
      router.refresh();
    } catch (error) {
      console.error(error);
      window.alert(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={onAccept} 
      disabled={isLoading}
      className="w-full h-12 gap-2 eyebrow text-[12px] shadow-[0_0_20px_rgba(0,217,146,0.2)]"
    >
      {isLoading ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          AUTHORIZING ACCESS...
        </>
      ) : (
        <>
          ACCEPT INVITATION
          <ArrowRight className="size-4" />
        </>
      )}
    </Button>
  );
}
