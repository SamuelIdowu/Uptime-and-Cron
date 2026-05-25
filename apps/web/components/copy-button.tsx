"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  className?: string;
  iconClassName?: string;
}

export function CopyButton({ value, className, iconClassName }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={onCopy}
      className={cn("size-7", className)}
    >
      {copied ? (
        <Check className={cn("size-3 text-primary", iconClassName)} />
      ) : (
        <Copy className={cn("size-3", iconClassName)} />
      )}
    </Button>
  );
}
