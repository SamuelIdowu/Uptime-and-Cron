"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { monitorSchema, MonitorInput } from "@/lib/validations/monitor";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Monitor } from "@steady-state/db";
import { Globe, Server, Clock, Activity, RefreshCw, ShieldCheck } from "lucide-react";

interface MonitorFormProps {
  initialData?: Monitor;
  onSuccess?: () => void;
}

export function MonitorForm({ initialData, onSuccess }: MonitorFormProps) {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<MonitorInput>({
    resolver: zodResolver(monitorSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          url: initialData.url,
          intervalMinutes: initialData.intervalMinutes,
          expectedStatus: initialData.expectedStatus,
          autoRetry: initialData.autoRetry,
          sslPolicy: initialData.sslPolicy as any,
        }
      : {
          name: "",
          url: "",
          intervalMinutes: 5,
          expectedStatus: 200,
          autoRetry: 3,
          sslPolicy: "strict",
        },
  });

  const onSubmit = async (values: MonitorInput) => {
    setIsLoading(true);
    try {
      const res = initialData 
        ? await fetch(`/api/monitors/${initialData.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          })
        : await fetch("/api/monitors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to save monitor");
      }

      router.refresh();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/${workspaceId}/dashboard`);
      }
    } catch (error) {
      console.error(error);
      window.alert(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 bg-card border border-border p-6 rounded-md">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="eyebrow text-[10px] text-mute flex items-center gap-2 mb-2 uppercase">
                  <Server className="size-3 text-primary-soft" />
                  Monitor Identity
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. Production Cluster" 
                    className="rounded-sm bg-secondary/50 border-border/60"
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-destructive text-[10px] mt-1 uppercase font-bold" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="eyebrow text-[10px] text-mute flex items-center gap-2 mb-2 uppercase">
                  <Globe className="size-3 text-primary-soft" />
                  Target Endpoint
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://api.steadystate.dev/v1/health" 
                    className="font-mono text-xs rounded-sm bg-secondary/50 border-border/60"
                    {...field} 
                  />
                </FormControl>
                <FormDescription className="text-[10px] text-mute font-mono uppercase opacity-60">
                  Full URL including protocol.
                </FormDescription>
                <FormMessage className="text-destructive text-[10px] mt-1 uppercase font-bold" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="intervalMinutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="eyebrow text-[10px] text-mute flex items-center gap-2 mb-2 uppercase">
                  <Clock className="size-3 text-primary-soft" />
                  Polling Frequency
                </FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(parseInt(val))}
                  defaultValue={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger className="rounded-sm bg-secondary/50 border-border/60 h-10">
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="1" className="font-mono text-xs uppercase">Every 60 Seconds (PRO)</SelectItem>
                    <SelectItem value="5" className="font-mono text-xs uppercase">Every 5 Minutes</SelectItem>
                    <SelectItem value="15" className="font-mono text-xs uppercase">Every 15 Minutes</SelectItem>
                    <SelectItem value="30" className="font-mono text-xs uppercase">Every 30 Minutes</SelectItem>
                    <SelectItem value="60" className="font-mono text-xs uppercase">Every 1 Hour</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-destructive text-[10px] mt-1 uppercase font-bold" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expectedStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="eyebrow text-[10px] text-mute flex items-center gap-2 mb-2 uppercase">
                  <Activity className="size-3 text-primary-soft" />
                  Pass Criteria (HTTP)
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    className="font-mono rounded-sm bg-secondary/50 border-border/60 h-10"
                    {...field} 
                  />
                </FormControl>
                <FormDescription className="text-[10px] text-mute font-mono uppercase opacity-60">
                  Status code that signals healthy node.
                </FormDescription>
                <FormMessage className="text-destructive text-[10px] mt-1 uppercase font-bold" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="autoRetry"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="eyebrow text-[10px] text-mute flex items-center gap-2 mb-2 uppercase">
                  <RefreshCw className="size-3 text-primary-soft" />
                  Automatic Retries
                </FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(parseInt(val))}
                  defaultValue={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger className="rounded-sm bg-secondary/50 border-border/60 h-10">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="0" className="font-mono text-xs uppercase">No Retries</SelectItem>
                    <SelectItem value="1" className="font-mono text-xs uppercase">1 Attempt</SelectItem>
                    <SelectItem value="3" className="font-mono text-xs uppercase">3 Attempts</SelectItem>
                    <SelectItem value="5" className="font-mono text-xs uppercase">5 Attempts</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-destructive text-[10px] mt-1 uppercase font-bold" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sslPolicy"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="eyebrow text-[10px] text-mute flex items-center gap-2 mb-2 uppercase">
                  <ShieldCheck className="size-3 text-primary-soft" />
                  SSL Verification
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="rounded-sm bg-secondary/50 border-border/60 h-10">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="strict" className="font-mono text-xs uppercase">Strict (Fail on error)</SelectItem>
                    <SelectItem value="standard" className="font-mono text-xs uppercase">Standard (Warning)</SelectItem>
                    <SelectItem value="none" className="font-mono text-xs uppercase">None (Ignore SSL)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-destructive text-[10px] mt-1 uppercase font-bold" />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-border/40">
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => onSuccess?.()}
            className="eyebrow text-[10px] h-10 px-6"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            size="default" 
            className="eyebrow text-[11px] px-10 h-10 shadow-[0_0_15px_rgba(0,217,146,0.1)]" 
            disabled={isLoading}
          >
            {isLoading ? "PROVISIONING..." : initialData ? "SAVE CHANGES" : "DEPLOY MONITOR"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
