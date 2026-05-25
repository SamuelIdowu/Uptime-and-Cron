"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyButton } from "@/components/copy-button";
import { Terminal, Shield } from "lucide-react";

interface IntegrationSnippetProps {
  url: string;
}

export function IntegrationSnippet({ url }: IntegrationSnippetProps) {
  const curlCommand = `curl.exe -m 10 --retry 3 ${url}`;
  const powershellCommand = `Invoke-RestMethod -Uri "${url}" -Method Get`;

  return (
    <Tabs defaultValue="curl" className="w-full">
      <div className="flex items-center justify-between mb-3">
        <p className="eyebrow text-[10px] text-mute">Integration Hook</p>
        <TabsList className="h-7">
          <TabsTrigger value="curl" className="px-2 py-1 text-[9px]">cURL (CMD/Bash)</TabsTrigger>
          <TabsTrigger value="powershell" className="px-2 py-1 text-[9px]">PowerShell</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="curl" className="mt-0">
        <div className="bg-secondary p-4 rounded-sm border border-border font-mono text-[11px] relative group overflow-hidden">
          <div className="flex items-center gap-2 mb-2 opacity-50">
            <Terminal className="size-3" />
            <span className="text-[9px] uppercase font-bold tracking-tighter">Command Prompt / Bash / Zsh</span>
          </div>
          <code className="text-primary-soft break-all pr-8 block">
            {curlCommand}
          </code>
          <CopyButton 
            value={curlCommand}
            className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity" 
          />
        </div>
      </TabsContent>

      <TabsContent value="powershell" className="mt-0">
        <div className="bg-secondary p-4 rounded-sm border border-border font-mono text-[11px] relative group overflow-hidden">
          <div className="flex items-center gap-2 mb-2 opacity-50">
            <Terminal className="size-3" />
            <span className="text-[9px] uppercase font-bold tracking-tighter">PowerShell 5.1+ / Core</span>
          </div>
          <code className="text-primary-soft break-all pr-8 block">
            {powershellCommand}
          </code>
          <CopyButton 
            value={powershellCommand}
            className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity" 
          />
        </div>
      </TabsContent>
      
      <p className="text-[10px] text-mute mt-3 font-mono leading-relaxed opacity-60">
        <Shield className="size-3 inline mr-1 mb-0.5" />
        PRO TIP: ON WINDOWS POWERSHELL, THE "CURL" ALIAS POINTS TO WEB-REQUEST. USE THE REAL "CURL.EXE" OR THE PS COMMAND ABOVE.
      </p>
    </Tabs>
  );
}
