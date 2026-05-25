"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CopyFieldProps {
  value: string;
  className?: string;
}

export function CopyField({ value, className }: CopyFieldProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex gap-2">
      <Input
        readOnly
        value={value}
        className="font-mono text-sm bg-muted/30"
      />
      <Button
        variant="outline"
        size="icon-sm"
        onClick={onCopy}
        className="shrink-0"
      >
        {copied ? (
          <Check className="size-4 text-primary" />
        ) : (
          <Copy className="size-4" />
        )}
      </Button>
    </div>
  );
}
