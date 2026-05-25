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
import { useRouter } from "next/navigation";
import { Monitor } from "@steady-state/db";

interface MonitorFormProps {
  initialData?: Monitor;
}

export function MonitorForm({ initialData }: MonitorFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<MonitorInput>({
    resolver: zodResolver(monitorSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          url: initialData.url,
          intervalMinutes: initialData.intervalMinutes,
          expectedStatus: initialData.expectedStatus,
        }
      : {
          name: "",
          url: "",
          intervalMinutes: 5,
          expectedStatus: 200,
        },
  });

  const onSubmit = async (values: MonitorInput) => {
    setIsLoading(true);
    try {
      if (initialData) {
        await fetch(`/api/monitors/${initialData.id}`, {
          method: "PATCH",
          body: JSON.stringify(values),
        });
      } else {
        await fetch("/api/monitors", {
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
                <Input placeholder="Production API" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://api.yourapp.com/health" 
                  className="font-mono" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                The URL to monitor. Must be http:// or https://.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="intervalMinutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Check every</FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(parseInt(val))}
                  defaultValue={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">1 minute</SelectItem>
                    <SelectItem value="3">3 minutes</SelectItem>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  1-minute checks require a paid plan.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expectedStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expected status</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Saving..." : initialData ? "Save changes" : "Create monitor"}
        </Button>
      </form>
    </Form>
  );
}
