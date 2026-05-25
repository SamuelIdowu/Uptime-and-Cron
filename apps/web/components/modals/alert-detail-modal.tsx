"use client";

import { Alert, Monitor, HeartbeatMonitor } from "@steady-state/db";
import { BaseModal } from "./base-modal";
import { StatusBadge } from "../status-badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  Bell, 
  Clock, 
  ExternalLink, 
  Terminal, 
  AlertTriangle,
  CheckCircle2,
  Mail,
  Slack,
  MessageSquare
} from "lucide-react";

interface AlertDetailModalProps {
  alert: any; // Using any for now to handle the joined data
  trigger?: React.ReactNode;
}

export function AlertDetailModal({ alert, trigger }: AlertDetailModalProps) {
  const isFailed = alert.status === "failed";
  const isSent = alert.status === "sent";
  
  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case "email": return <Mail className="size-3.5" />;
      case "slack": return <Slack className="size-3.5" />;
      case "telegram": return <MessageSquare className="size-3.5" />;
      default: return <Bell className="size-3.5" />;
    }
  };

  return (
    <BaseModal
      title="Alert Delivery Details"
      description={`Log ID: ${alert.id}`}
      trigger={trigger}
      maxWidth="lg"
    >
      <div className="space-y-8">
        {/* Status Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-border bg-secondary/10 rounded-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-mute uppercase tracking-widest">Type</span>
            <div className="flex items-center gap-2">
              <StatusBadge 
                status={alert.type.toLowerCase() === "up" ? "up" : alert.type.toLowerCase() === "down" ? "down" : "late"}
              >
                {alert.type}
              </StatusBadge>
              <span className="text-sm font-semibold text-inkStrong">Monitor Incident</span>
            </div>
          </div>

          <div className="space-y-1 sm:text-right">
            <span className="text-[10px] font-bold text-mute uppercase tracking-widest">Delivery Status</span>
            <div className="flex items-center sm:justify-end gap-2">
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm border",
                isFailed ? "bg-status-down/10 text-status-down border-status-down/20" : 
                isSent ? "bg-status-up/10 text-status-up border-status-up/20" :
                "bg-status-pending/10 text-status-pending border-status-pending/20"
              )}>
                {alert.status}
              </span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-mute">
                <Terminal className="size-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Target Resource</span>
              </div>
              <p className="text-sm font-medium text-inkStrong">{alert.monitorName}</p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-mute">
                <Clock className="size-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Triggered At</span>
              </div>
              <p className="text-sm font-medium text-inkStrong">
                {format(new Date(alert.time), "MMM d, yyyy HH:mm:ss 'UTC'")}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-mute">
                {getChannelIcon(alert.channel)}
                <span className="text-[10px] font-bold uppercase tracking-widest">Channel</span>
              </div>
              <p className="text-sm font-medium text-inkStrong uppercase">{alert.channel}</p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-mute">
                <CheckCircle2 className="size-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Sent At</span>
              </div>
              <p className="text-sm font-medium text-inkStrong">
                {alert.sentAt ? format(new Date(alert.sentAt), "MMM d, yyyy HH:mm:ss 'UTC'") : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Delivery Logs/Error */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-mute">
            <Terminal className="size-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Delivery Log</span>
          </div>
          <div className="bg-secondary/30 border border-border p-4 rounded-sm font-mono text-[11px] space-y-2">
            <div className="flex gap-3">
              <span className="text-mute/50 shrink-0">1</span>
              <span className="text-mute">{`[${new Date(alert.time).toISOString()}] [INFO] Event matched notification rule.`}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-mute/50 shrink-0">2</span>
              <span className="text-mute">{`[${new Date(alert.time).toISOString()}] [INFO] Queuing delivery for channel: ${alert.channel}.`}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-mute/50 shrink-0">3</span>
              <span className={cn(isFailed ? "text-status-down" : "text-status-up")}>
                {isFailed 
                  ? `[ERROR] Delivery failed: ${alert.error || "Unknown provider error."}`
                  : `[SUCCESS] Dispatched to ${alert.channel} successfully.`
                }
              </span>
            </div>
            {alert.retryCount > 0 && (
              <div className="flex gap-3">
                <span className="text-mute/50 shrink-0">4</span>
                <span className="text-status-pending">{`[RETRY] Total attempts: ${alert.retryCount + 1}`}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
