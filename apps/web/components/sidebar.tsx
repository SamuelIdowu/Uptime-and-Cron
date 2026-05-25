"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Activity, 
  LayoutDashboard, 
  Settings, 
  AlertTriangle, 
  Bell, 
  PanelLeftClose, 
  PanelLeftOpen,
  MonitorCheck,
  FileText,
  Wrench,
  Users,
  Blocks,
  Zap
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "./ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion, AnimatePresence } from "framer-motion";

export function Sidebar({ workspaceId }: { workspaceId: string }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const primaryNavItems = [
    { title: "Overview", href: `/${workspaceId}/dashboard`, icon: LayoutDashboard },
    { title: "Monitors", href: `/${workspaceId}/monitors`, icon: MonitorCheck },
    { title: "Status Pages", href: `/${workspaceId}/status-pages`, icon: FileText },
    { title: "Incidents", href: `/${workspaceId}/incidents`, icon: AlertTriangle },
    { title: "Maintenance", href: `/${workspaceId}/maintenance`, icon: Wrench },
  ];

  const secondaryNavItems = [
    { title: "Integrations", href: `/${workspaceId}/integrations`, icon: Blocks },
    { title: "Team", href: `/${workspaceId}/team`, icon: Users },
    { title: "Settings", href: `/${workspaceId}/settings`, icon: Settings },
  ];

  const renderNavItems = (items: typeof primaryNavItems) => (
    items.map((item) => {
      const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
      return (
        <Link
          key={item.href}
          href={item.href}
          title={isCollapsed ? item.title : undefined}
          className={cn(
            "relative flex items-center py-1.5 transition-all text-sm font-medium rounded-sm group mx-2",
            isCollapsed ? "justify-center px-0" : "px-2",
            isActive 
              ? "bg-primary/5 text-primary border border-primary/20" 
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <item.icon className={cn("size-3.5 shrink-0 z-10", isActive ? "text-primary" : "group-hover:text-foreground")} />
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="ml-3 truncate whitespace-nowrap z-10 font-sans"
              >
                {item.title}
              </motion.span>
            )}
          </AnimatePresence>
          {isActive && !isCollapsed && (
            <motion.div 
              layoutId="active-nav-indicator"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-primary rounded-full -ml-3"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
        </Link>
      );
    })
  );

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 64 : 220 }}
      className="border-r border-border bg-background h-screen sticky top-0 flex flex-col hidden sm:flex z-20 shrink-0"
    >
      <div className={cn("flex items-center h-16", isCollapsed ? "justify-center" : "px-4 justify-between")}>
        <Link 
          href={`/${workspaceId}/dashboard`} 
          className={cn("flex items-center gap-2 hover:opacity-80 transition-opacity overflow-hidden", isCollapsed && "justify-center")}
        >
          <div className="size-6 rounded-sm bg-primary flex items-center justify-center shadow-[0_0_10px_rgba(0,217,146,0.2)]">
            <Zap className="size-3 text-background" />
          </div>
          <AnimatePresence initial={false} mode="wait">
            {!isCollapsed && (
              <motion.h1 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-base font-bold tracking-tight text-foreground font-sans truncate whitespace-nowrap"
              >
                SteadyState
              </motion.h1>
            )}
          </AnimatePresence>
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto py-1 space-y-6">
        <div className="space-y-0.5 text-md">
          {renderNavItems(primaryNavItems)}
        </div>

        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-4"
              >
                <h3 className="eyebrow text-[9px] text-muted-foreground opacity-60">System</h3>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="space-y-0.5">
            {renderNavItems(secondaryNavItems)}
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-border/40 space-y-3">
        <div className={cn(
          "flex items-center p-1.5 rounded-sm transition-all",
          isCollapsed ? "justify-center" : "w-full justify-between gap-2 bg-secondary/30 border border-border"
        )}>
          <div className="flex items-center gap-2 overflow-hidden">
            <UserButton 
              appearance={{ 
                elements: { 
                  userButtonAvatarBox: "size-7 border border-border rounded-sm" 
                } 
              }} 
            />
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex flex-col whitespace-nowrap"
                >
                  <span className="text-[10px] font-bold text-foreground truncate font-mono uppercase tracking-tight">Active Node</span>
                  <span className="eyebrow text-[8px] text-muted-foreground truncate">Free Plan</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {!isCollapsed && <ThemeToggle />}
        </div>
        
        {isCollapsed && (
          <div className="flex justify-center">
            <ThemeToggle />
          </div>
        )}
        
        <Button 
          variant="ghost" 
          size="icon-xs" 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="absolute -right-2.5 top-16 border border-border bg-background text-muted-foreground hover:text-foreground shadow-xl z-50 rounded-full size-5"
        >
          {isCollapsed ? <PanelLeftOpen className="size-2.5" /> : <PanelLeftClose className="size-2.5" />}
        </Button>
      </div>
    </motion.aside>
  );
}
