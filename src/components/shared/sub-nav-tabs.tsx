"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Package,
  Truck,
  Layers,
  FileSpreadsheet,
  Radio,
  Mic,
  BarChart3,
  Zap,
  Sparkles,
  Sliders,
  Activity,
  UserCheck,
  Users,
  CreditCard,
  Bell,
  Shield,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  package: Package,
  truck: Truck,
  layers: Layers,
  spreadsheet: FileSpreadsheet,
  radio: Radio,
  mic: Mic,
  barchart: BarChart3,
  zap: Zap,
  sparkles: Sparkles,
  sliders: Sliders,
  activity: Activity,
  usercheck: UserCheck,
  users: Users,
  creditcard: CreditCard,
  bell: Bell,
  shield: Shield,
};

export interface SubNavTab {
  label: string;
  href: string;
  iconName?: keyof typeof ICON_MAP | string;
  badge?: string;
}

interface SubNavTabsProps {
  tenantSlug: string;
  tabs: SubNavTab[];
  className?: string;
}

export function SubNavTabs({ tenantSlug, tabs, className }: SubNavTabsProps) {
  const pathname = usePathname();

  return (
    <div className={cn("w-full border-b border-slate-200/80 pb-3 mb-6 font-bengali", className)}>
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
        {tabs.map((tab) => {
          const targetUrl = `/${tenantSlug}${tab.href}`;
          const isSelected = pathname === targetUrl || (tab.href !== "" && pathname.startsWith(targetUrl + "/"));
          const Icon = tab.iconName ? ICON_MAP[tab.iconName] : undefined;

          return (
            <Link
              key={tab.href}
              href={targetUrl}
              className={cn(
                "group relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap",
                isSelected
                  ? "bg-indigo-600 text-white shadow-xs font-bold"
                  : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 shadow-2xs"
              )}
            >
              {Icon && (
                <Icon
                  className={cn(
                    "w-4 h-4 transition-transform group-hover:scale-105",
                    isSelected ? "text-white" : "text-slate-400 group-hover:text-indigo-600"
                  )}
                />
              )}
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-amber-100 text-amber-800"
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
