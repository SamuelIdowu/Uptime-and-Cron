"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { maintenanceSchema, MaintenanceInput } from "@/lib/validations/maintenance";
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
import { Monitor, HeartbeatMonitor } from "@steady-state/db";
import { Clock, Calendar, Wrench, Globe, Zap, Heart, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface MaintenanceFormProps {
  monitors: Monitor[];
  heartbeats: HeartbeatMonitor[];
  initialData?: any;
  onSuccess?: () => void;
}

export function MaintenanceForm({ monitors, heartbeats, initialData, onSuccess }: MaintenanceFormProps) {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [isLoading, setIsLoading] = useState(false);

  // Helper to format date for datetime-local input
  const formatDateForInput = (date: Date | string | null | undefined) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    // Adjust for local timezone to match datetime-local's expectations
    return format(d, "yyyy-MM-dd'T'HH:mm");
  };

  const form = useForm<MaintenanceInput>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: initialData
      ? {
          monitorId: initialData.monitorId,
          heartbeatId: initialData.heartbeatId,
          startTime: initialData.startTime,
          endTime: initialData.endTime,
          reason: initialData.reason || "",
        }
      : {
          monitorId: null,
          heartbeatId: null,
          startTime: new Date(Date.now() + 60 * 60 * 1000), // Default start in 1 hour
          endTime: new Date(Date.now() + 120 * 60 * 1000),   // Default end in 2 hours
          reason: "",
        },
  });

  const onSubmit = async (values: MaintenanceInput) => {
    setIsLoading(true);
    try {
      const res = initialData 
        ? await fetch(`/api/maintenance/${initialData.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          })
        : await fetch("/api/maintenance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to save maintenance window");
      }

      toast.success(initialData ? "Maintenance window updated" : "Maintenance window scheduled");
      router.refresh();
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const currentTargetValue = form.watch("monitorId") 
    ? `monitor:${form.watch("monitorId")}` 
    : form.watch("heartbeatId") 
      ? `heartbeat:${form.watch("heartbeatId")}` 
      : "global";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-6 bg-card border border-border p-6 rounded-md">
          {/* Section 1: Target */}
          <FormItem>
            <FormLabel className="eyebrow text-[10px] text-mute flex items-center gap-2 mb-2 uppercase">
              <Globe className="size-3 text-primary-soft" />
              Maintenance Target
            </FormLabel>
            <Select 
              value={currentTargetValue}
              onValueChange={(val) => {
                if (val === "global") {
                  form.setValue("monitorId", null);
                  form.setValue("heartbeatId", null);
                } else if (val.startsWith("monitor:")) {
                  form.setValue("monitorId", val.split(":")[1]);
                  form.setValue("heartbeatId", null);
                } else if (val.startsWith("heartbeat:")) {
                  form.setValue("monitorId", null);
                  form.setValue("heartbeatId", val.split(":")[1]);
                }
              }}
            >
              <FormControl>
                <SelectTrigger className="rounded-sm bg-secondary/50 border-border/60 h-10">
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="global" className="font-mono text-xs uppercase">
                  <div className="flex items-center gap-2">
                    <Globe className="size-3 text-primary-soft" />
                    Global (All Infrastructure)
                  </div>
                </SelectItem>
                {monitors.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-[9px] font-bold text-mute eyebrow opacity-50 border-t border-border mt-1">HTTP MONITORS</div>
                    {monitors.map((m) => (
                      <SelectItem key={m.id} value={`monitor:${m.id}`} className="font-mono text-xs uppercase">
                        <div className="flex items-center gap-2">
                          <Zap className="size-3 text-primary-soft" />
                          {m.name}
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
                {heartbeats.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-[9px] font-bold text-mute eyebrow opacity-50 border-t border-border mt-1">HEARTBEATS</div>
                    {heartbeats.map((h) => (
                      <SelectItem key={h.id} value={`heartbeat:${h.id}`} className="font-mono text-xs uppercase">
                        <div className="flex items-center gap-2">
                          <Heart className="size-3 text-primary-soft" />
                          {h.name}
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
            <FormDescription className="text-[10px] text-mute font-mono uppercase mt-1.5">
              Select the specific monitor or heartbeat to pause during this window.
            </FormDescription>
            <FormMessage className="text-destructive text-[10px] mt-1 uppercase font-bold" />
          </FormItem>

          {/* Section 2: Timing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="eyebrow text-[10px] text-mute flex items-center gap-2 mb-2 uppercase">
                    <Calendar className="size-3 text-primary-soft" />
                    Start Time
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="datetime-local" 
                      className="font-mono text-xs rounded-sm bg-secondary/50 border-border/60 h-10"
                      value={formatDateForInput(field.value)}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage className="text-destructive text-[10px] mt-1 uppercase font-bold" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="eyebrow text-[10px] text-mute flex items-center gap-2 mb-2 uppercase">
                    <Clock className="size-3 text-primary-soft" />
                    End Time
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="datetime-local" 
                      className="font-mono text-xs rounded-sm bg-secondary/50 border-border/60 h-10"
                      value={formatDateForInput(field.value)}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage className="text-destructive text-[10px] mt-1 uppercase font-bold" />
                </FormItem>
              )}
            />
          </div>

          {/* Section 3: Reason */}
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="eyebrow text-[10px] text-mute flex items-center gap-2 mb-2 uppercase">
                  <MessageSquare className="size-3 text-primary-soft" />
                  Reason / Description
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. Scheduled database migration" 
                    className="rounded-sm bg-secondary/50 border-border/60"
                    {...field} 
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription className="text-[10px] text-mute font-mono uppercase mt-1.5">
                  Brief explanation for why monitors are being silenced.
                </FormDescription>
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
            {isLoading ? "SCHEDULING..." : initialData ? "SAVE CHANGES" : "SCHEDULE WINDOW"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
