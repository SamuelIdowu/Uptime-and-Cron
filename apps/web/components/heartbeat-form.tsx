"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { heartbeatSchema, HeartbeatInput } from "@/lib/validations/heartbeat";
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
import { HeartbeatMonitor } from "@steady-state/db";
import { Heart, Clock, ShieldCheck } from "lucide-react";

interface HeartbeatFormProps {
  initialData?: HeartbeatMonitor;
  onSuccess?: () => void;
}

export function HeartbeatForm({ initialData, onSuccess }: HeartbeatFormProps) {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [isLoading, setIsLoading] = useState(false);
  const [unit, setUnit] = useState<"minutes" | "hours" | "days">("minutes");
  const [periodValue, setPeriodValue] = useState(initialData?.periodMinutes || 5);

  const form = useForm<HeartbeatInput>({
    resolver: zodResolver(heartbeatSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          periodMinutes: initialData.periodMinutes,
          graceMinutes: initialData.graceMinutes,
        }
      : {
          name: "",
          periodMinutes: 5,
          graceMinutes: 5,
        },
  });

  const onSubmit = async (values: HeartbeatInput) => {
    setIsLoading(true);
    try {
      const res = initialData
        ? await fetch(`/api/heartbeats/${initialData.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          })
        : await fetch("/api/heartbeats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to save heartbeat");
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

  const updatePeriodMinutes = (val: number, currentUnit: string) => {
    let minutes = val;
    if (currentUnit === "hours") minutes = val * 60;
    if (currentUnit === "days") minutes = val * 1440;
    form.setValue("periodMinutes", minutes);
    setPeriodValue(val);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="eyebrow text-[10px] text-mute flex items-center gap-2 mb-2">
                  <Heart className="size-3 text-primary-soft" />
                  Monitor Identity
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. Daily DB Backup" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-destructive text-xs mt-1" />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormLabel className="eyebrow text-[10px] text-mute flex items-center gap-2 mb-2">
              <Clock className="size-3 text-primary-soft" />
              Interval Period
            </FormLabel>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  value={periodValue}
                  className="font-mono text-sm"
                  onChange={(e) => updatePeriodMinutes(parseInt(e.target.value) || 0, unit)}
                />
              </div>
              <Select
                value={unit}
                onValueChange={(val: any) => {
                  setUnit(val);
                  updatePeriodMinutes(periodValue, val);
                }}
              >
                <SelectTrigger className="w-[110px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes" className="font-mono text-[11px] uppercase">MINS</SelectItem>
                  <SelectItem value="hours" className="font-mono text-[11px] uppercase">HOURS</SelectItem>
                  <SelectItem value="days" className="font-mono text-[11px] uppercase">DAYS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <FormDescription className="text-[10px] text-mute font-mono">
              Expected time between check-ins.
            </FormDescription>
            <FormMessage className="text-destructive text-xs mt-1" />
          </div>

          <FormField
            control={form.control}
            name="graceMinutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="eyebrow text-[10px] text-mute flex items-center gap-2 mb-2">
                  <ShieldCheck className="size-3 text-primary-soft" />
                  Grace Period
                </FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(parseInt(val))}
                  defaultValue={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grace period" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1" className="font-mono text-xs">1 MINUTE</SelectItem>
                    <SelectItem value="5" className="font-mono text-xs">5 MINUTES</SelectItem>
                    <SelectItem value="15" className="font-mono text-xs">15 MINUTES</SelectItem>
                    <SelectItem value="30" className="font-mono text-xs">30 MINUTES</SelectItem>
                    <SelectItem value="60" className="font-mono text-xs">1 HOUR</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="text-[10px] text-mute font-mono">
                  Additional buffer before alert.
                </FormDescription>
                <FormMessage className="text-destructive text-xs mt-1" />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-border/40">
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => router.back()}
            className="eyebrow text-[10px]"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            size="default" 
            className="eyebrow text-[11px] px-8" 
            disabled={isLoading}
          >
            {isLoading ? "PROVISIONING..." : initialData ? "SAVE CHANGES" : "DEPLOY HEARTBEAT"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
