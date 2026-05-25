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
import { useRouter } from "next/navigation";
import { HeartbeatMonitor } from "@steady-state/db";

interface HeartbeatFormProps {
  initialData?: HeartbeatMonitor;
}

export function HeartbeatForm({ initialData }: HeartbeatFormProps) {
  const router = useRouter();
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
      if (initialData) {
        await fetch(`/api/heartbeats/${initialData.id}`, {
          method: "PATCH",
          body: JSON.stringify(values),
        });
      } else {
        await fetch("/api/heartbeats", {
          method: "POST",
          body: JSON.stringify(values),
        });
      }
      router.refresh();
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Nightly DB backup" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormLabel>Expected every</FormLabel>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="number"
                value={periodValue}
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
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minutes">Minutes</SelectItem>
                <SelectItem value="hours">Hours</SelectItem>
                <SelectItem value="days">Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <FormDescription>
            How often you expect a ping from your job.
          </FormDescription>
          <FormMessage>
            {form.formState.errors.periodMinutes?.message}
          </FormMessage>
        </div>

        <FormField
          control={form.control}
          name="graceMinutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Grace period</FormLabel>
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
                  <SelectItem value="1">1 minute</SelectItem>
                  <SelectItem value="2">2 minutes</SelectItem>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                How long to wait past the expected time before alerting.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Saving..." : initialData ? "Save changes" : "Create heartbeat"}
        </Button>
      </form>
    </Form>
  );
}
