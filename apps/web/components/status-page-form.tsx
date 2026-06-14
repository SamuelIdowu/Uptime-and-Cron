"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { statusPageSchema, StatusPageInput } from "@/lib/validations/status-page";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { StatusPage, Monitor } from "@steady-state/db";
import { FileText, Link as LinkIcon, Palette, Activity, Save, Globe, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface StatusPageFormProps {
  initialData?: StatusPage & { monitors?: { monitorId: string }[] };
  onSuccess?: () => void;
}

export function StatusPageForm({ initialData, onSuccess }: StatusPageFormProps) {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [isLoading, setIsLoading] = useState(false);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [isLoadingMonitors, setIsLoadingMonitors] = useState(true);
  const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);

  useEffect(() => {
    async function fetchMonitors() {
      try {
        const res = await fetch("/api/monitors");
        if (res.ok) {
          const data = await res.status === 200 ? await res.json() : [];
          setMonitors(data);
        }
      } catch (error) {
        console.error("Failed to fetch monitors", error);
      } finally {
        setIsLoadingMonitors(false);
      }
    }
    fetchMonitors();
  }, []);

  const form = useForm<StatusPageInput>({
    resolver: zodResolver(statusPageSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          slug: initialData.slug,
          description: initialData.description || "",
          logoUrl: initialData.logoUrl || "",
          published: initialData.published,
          themeConfig: (initialData.themeConfig as any) || { primaryColor: "#00d992", headerText: "" },
          monitorIds: initialData.monitors?.map(m => m.monitorId) || [],
        }
      : {
          name: "",
          slug: "",
          description: "",
          logoUrl: "",
          published: false,
          themeConfig: { primaryColor: "#00d992", headerText: "" },
          monitorIds: [],
        },
  });

  const slug = form.watch("slug");
  const name = form.watch("name");

  // Auto-generate slug from name
  useEffect(() => {
    if (!initialData && name && !form.getFieldState("slug").isDirty) {
      const generatedSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      form.setValue("slug", generatedSlug, { shouldValidate: true });
    }
  }, [name, form, initialData]);

  // Real-time slug validation
  useEffect(() => {
    if (!slug || slug.length < 3) {
      setIsSlugAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingSlug(true);
      try {
        const res = await fetch(`/api/status-pages/check-slug?slug=${slug}${initialData ? `&excludeId=${initialData.id}` : ""}`);
        const data = await res.json();
        setIsSlugAvailable(data.available);
        if (!data.available) {
          form.setError("slug", { message: "This URL slug is already taken" });
        } else {
          form.clearErrors("slug");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsCheckingSlug(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [slug, initialData, form]);

  const onSubmit = async (values: StatusPageInput) => {
    if (isSlugAvailable === false) return;
    
    setIsLoading(true);
    try {
      const res = initialData 
        ? await fetch(`/api/status-pages/${initialData.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          })
        : await fetch("/api/status-pages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to save status page");
      }

      toast.success(initialData ? "Status page updated" : "Status page created");
      router.refresh();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/${workspaceId}/status-pages`);
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
        <div className="flex-1 space-y-8 pb-24">
          <div className="space-y-6 bg-card border border-border p-6 rounded-md">
            {/* Section 1: Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="eyebrow text-[10px] text-mute flex items-center gap-2 mb-2 uppercase">
                      <FileText className="size-3 text-primary-soft" />
                      Page Name
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. System Health" 
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
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="eyebrow text-[10px] text-mute flex items-center gap-2 mb-2 uppercase">
                      <LinkIcon className="size-3 text-primary-soft" />
                      URL Slug
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="system-health" 
                          className={cn(
                            "rounded-sm bg-secondary/50 border-border/60 font-mono text-xs pr-8",
                            isSlugAvailable === true && "border-primary/50",
                            isSlugAvailable === false && "border-destructive/50"
                          )}
                          {...field} 
                        />
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                          {isCheckingSlug ? (
                            <RefreshCw className="size-3 animate-spin text-mute" />
                          ) : isSlugAvailable === true ? (
                            <div className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(0,217,146,0.8)]" />
                          ) : isSlugAvailable === false ? (
                            <div className="size-1.5 rounded-full bg-destructive shadow-[0_0_8px_rgba(255,0,0,0.8)]" />
                          ) : null}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage className="text-destructive text-[10px] mt-1 uppercase font-bold" />
                  </FormItem>
                )}
              />
            </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="eyebrow text-[10px] text-mute uppercase mb-2 block">Description (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Real-time performance metrics for global endpoints." 
                    className="rounded-sm bg-secondary/50 border-border/60"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/40">
             <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="eyebrow text-[10px] text-mute uppercase mb-2 block">Logo URL (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com/logo.png" 
                      className="rounded-sm bg-secondary/50 border-border/60 text-xs font-mono"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="themeConfig.primaryColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="eyebrow text-[10px] text-mute flex items-center gap-2 mb-2 uppercase">
                    <Palette className="size-3 text-primary-soft" />
                    Brand Color
                  </FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input 
                        type="color" 
                        className="w-10 h-10 p-1 rounded-sm bg-secondary/50 border-border/60 cursor-pointer"
                        {...field} 
                      />
                    </FormControl>
                    <Input 
                      value={field.value} 
                      onChange={field.onChange}
                      className="font-mono text-xs uppercase rounded-sm bg-secondary/50 border-border/60"
                      maxLength={7}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Section 2: Monitors */}
          <div className="space-y-4 pt-6 border-t border-border/40">
            <FormLabel className="eyebrow text-[10px] text-mute flex items-center gap-2 uppercase">
              <Activity className="size-3 text-primary-soft" />
              Service Selection
            </FormLabel>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {isLoadingMonitors ? (
                <p className="text-[10px] text-mute uppercase animate-pulse">Scanning infrastructure...</p>
              ) : monitors.length === 0 ? (
                <p className="text-[10px] text-mute uppercase opacity-60">No monitors available. Deploy one first.</p>
              ) : (
                monitors.map((monitor) => (
                  <FormField
                    key={monitor.id}
                    control={form.control}
                    name="monitorIds"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={monitor.id}
                          className="flex flex-row items-center space-x-3 space-y-0 p-3 rounded-sm border border-border/60 bg-secondary/30 hover:bg-secondary/80 transition-colors"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(monitor.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value || [], monitor.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== monitor.id
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-[11px] font-bold uppercase tracking-tight cursor-pointer flex-1">
                            {monitor.name}
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))
              )}
            </div>
          </div>

          <FormField
            control={form.control}
            name="published"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 pt-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-0.5">
                  <FormLabel className="text-[11px] font-bold uppercase tracking-tight">Public Visibility</FormLabel>
                  <FormDescription className="text-[10px] font-mono uppercase opacity-60">
                    Make this status page accessible to the public internet.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>
        </div>

        <div className="sticky bottom-0 left-0 right-0 flex items-center justify-end gap-3 py-6 px-10 border-t border-border/40 bg-background/95 backdrop-blur-sm -mx-10 mt-auto">
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
            disabled={isLoading || isSlugAvailable === false || isCheckingSlug}
          >
            {isLoading ? "INITIALIZING..." : initialData ? "SAVE CHANGES" : "PROVISION PAGE"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
