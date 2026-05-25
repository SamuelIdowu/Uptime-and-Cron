"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Globe, Plus, Trash2, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const environmentSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  baseUrl: z.string().url("Must be a valid URL").max(2048),
});

type EnvironmentInput = z.infer<typeof environmentSchema>;

interface Environment {
  id: string;
  name: string;
  baseUrl: string;
}

export function EnvironmentForm() {
  const router = useRouter();
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EnvironmentInput>({
    resolver: zodResolver(environmentSchema),
    defaultValues: {
      name: "",
      baseUrl: "",
    },
  });

  useEffect(() => {
    fetchEnvironments();
  }, []);

  const fetchEnvironments = async () => {
    try {
      const response = await fetch("/api/environments");
      if (response.ok) {
        const data = await response.json();
        setEnvironments(data);
      }
    } catch (error) {
      console.error("Failed to fetch environments", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: EnvironmentInput) => {
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/environments", {
        method: "POST",
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("Failed to save");

      toast.success("Environment added successfully");
      form.reset();
      fetchEnvironments();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/environments/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      toast.success("Environment removed");
      fetchEnvironments();
    } catch (error) {
      toast.error("Failed to delete environment");
    }
  };

  return (
    <div className="space-y-8">
      <div className="p-8 bg-card border border-border rounded-md space-y-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="eyebrow text-[10px] text-mute uppercase">Environment Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Production" 
                        {...field} 
                        className="bg-secondary border-border font-mono text-xs uppercase"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="baseUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="eyebrow text-[10px] text-mute uppercase">Base URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://api.myapp.com" 
                        {...field} 
                        className="bg-secondary border-border font-mono text-xs"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full sm:w-auto eyebrow text-[10px] h-10 px-8"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Add Environment
            </Button>
          </form>
        </Form>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="size-3 text-mute" />
            <h3 className="eyebrow text-[10px] text-mute uppercase">Defined Environments</h3>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="size-6 animate-spin text-mute" />
            </div>
          ) : environments.length === 0 ? (
            <div className="text-center p-8 border border-dashed border-border rounded-md bg-secondary/50">
              <p className="text-[10px] text-mute font-mono uppercase">No environment profiles configured.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {environments.map((env) => (
                <div 
                  key={env.id} 
                  className="flex items-center justify-between p-4 bg-secondary border border-border rounded-sm group transition-colors hover:bg-secondary/80"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-inkStrong font-mono uppercase tracking-tight">{env.name}</p>
                    <p className="text-[10px] text-mute font-mono lowercase truncate max-w-[200px] sm:max-w-md">{env.baseUrl}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(env.id)}
                    className="size-8 text-mute hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
