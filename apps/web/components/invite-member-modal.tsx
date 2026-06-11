"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { teamInviteSchema, TeamInviteInput } from "@/lib/validations/team";
import {
  Form,
  FormControl,
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
import { Mail, Shield, UserPlus, Eye } from "lucide-react";
import { BaseModal } from "@/components/modals/base-modal";

interface InviteMemberModalProps {
  workspaceId: string;
}

export function InviteMemberModal({ workspaceId }: InviteMemberModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TeamInviteInput>({
    resolver: zodResolver(teamInviteSchema),
    defaultValues: {
      email: "",
      role: "viewer",
    },
  });

  const onSubmit = async (values: TeamInviteInput) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          workspaceId,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to send invitation");
      }

      form.reset();
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      window.alert(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={setOpen}
      title="Invite Team Member"
      description="Add a new operator to this workspace. They will receive an email to join."
      trigger={
        <Button size="sm" className="gap-2 h-9 px-4 eyebrow text-[11px]">
          <UserPlus className="size-3.5" />
          Invite Member
        </Button>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="eyebrow text-[10px] text-mute flex items-center gap-2 mb-2 uppercase">
                  <Mail className="size-3 text-primary-soft" />
                  Operator Email
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="operator@steadystate.dev" 
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
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="eyebrow text-[10px] text-mute flex items-center gap-2 mb-2 uppercase">
                  <Shield className="size-3 text-primary-soft" />
                  Access Role
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-sm bg-secondary/50 border-border/60 h-10">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="viewer" className="font-mono text-xs uppercase">
                      <div className="flex items-center gap-2">
                        <Eye className="size-3 text-mute" />
                        <span>Viewer (Read Only)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin" className="font-mono text-xs uppercase">
                      <div className="flex items-center gap-2">
                        <Shield className="size-3 text-primary-soft" />
                        <span>Admin (Full Access)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-destructive text-[10px] mt-1 uppercase font-bold" />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => setOpen(false)}
              className="eyebrow text-[10px] h-9"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              size="sm" 
              className="eyebrow text-[10px] h-9 px-6" 
              disabled={isLoading}
            >
              {isLoading ? "SENDING..." : "SEND INVITATION"}
            </Button>
          </div>
        </form>
      </Form>
    </BaseModal>
  );
}
