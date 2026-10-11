"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  ShoppingBag,
  PhoneCall,
  Megaphone,
  Bot,
  BarChart3,
  Plug,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";

interface SidebarProps {
  tenantSlug: string;
  storeName?: string;
  userEmail?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export function Sidebar({
  tenantSlug,
  storeName,
  userEmail,
  isCollapsed = false,
  onToggleCollapse,
  className,
}: SidebarProps) {
  const pathname = usePathname();
  const { lang, setLang, t } = useLanguage();

  // Helper to check if a main section is currently active
  const isSectionActive = (basePath: string) => {
    if (basePath === "/dashboard") return pathname === `/${tenantSlug}/dashboard`;
    if (basePath === "/inbox") return pathname === `/${tenantSlug}/inbox`;
    if (basePath === "/integrations") return pathname === `/${tenantSlug}/integrations`;
    return pathname.startsWith(`/${tenantSlug}${basePath}`);
  };

  const NAV_ITEMS = [
    {
      label: t("nav.dashboard") || "Dashboard",
      labelBn: "ড্যাশবোর্ড",
      href: "/dashboard",
      section: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: t("nav.inbox") || "Inbox",
      labelBn: "ইনবক্স",
      href: "/inbox",
      section: "/inbox",
      icon: Inbox,
      badge: (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>লাইভ</span>
        </span>
      ),
    },
    {
      label: t("nav.sales") || "Sales",
      labelBn: "সেলস ও কুরিয়ার",
      href: "/sales/orders",
      section: "/sales",
      icon: ShoppingBag,
    },
    {
      label: t("nav.calls") || "Calls",
      labelBn: "এআই ভয়েস কলিং",
      href: "/calls/ai-calls",
      section: "/calls",
      icon: PhoneCall,
    },
    {
      label: t("nav.marketing") || "Marketing",
      labelBn: "গ্রোথ ও মার্কেটিং",
      href: "/marketing/ads-flow",
      section: "/marketing",
      icon: Megaphone,
    },
    {
      label: t("nav.ai_training") || "AI Training",
      labelBn: "এআই ট্রেইনিং",
      href: "/ai-training/ai-setup",
      section: "/ai-training",
      icon: Bot,
    },
    {
      label: t("nav.insights") || "Insights",
      labelBn: "ইনসাইটস ও রিপোর্ট",
      href: "/insights/analytics",
      section: "/insights",
      icon: BarChart3,
    },
    {
      label: t("nav.integrations") || "Integrations",
      labelBn: "ইন্টিগ্রেশনস",
      href: "/integrations",
      section: "/integrations",
      icon: Plug,
      badge: (
        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold group-[.active]:bg-white/20 group-[.active]:text-white">
          ১৬+ অ্যাপ
        </span>
      ),
    },
    {
      label: t("nav.settings") || "Settings",
      labelBn: "শপ সেটিংস",
      href: "/settings/profile",
      section: "/settings",
      icon: Settings,
    },
  ];

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-slate-200/90 bg-white text-slate-800 transition-all duration-200 z-40 select-none sticky top-0 font-body shadow-xs",
        isCollapsed ? "w-18" : "w-64",
        className
      )}
    >
      {/* 1. Header (Brand Logo + Collapse Toggle Button) */}
      <div className={cn(
        "flex h-16 items-center border-b border-slate-100 shrink-0",
        isCollapsed ? "justify-center px-2" : "justify-between px-4"
      )}>
        <Link
          href={`/${tenantSlug}/dashboard`}
          className="flex items-center gap-2.5 no-underline group min-w-0"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 font-heading font-extrabold text-white text-sm shadow-xs shadow-indigo-600/30 shrink-0 transition-transform group-hover:scale-105">
            M
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <div className="font-heading font-bold text-sm text-slate-900 tracking-tight flex items-center gap-1">
                <span>Mogent</span>
                <span className="text-indigo-600">AI</span>
                <span className="bd-flag-icon" />
              </div>
              <span className="text-[10px] text-slate-500 font-bengali font-medium leading-none">
                মার্চেন্ট ককপিট v2.0
              </span>
            </div>
          )}
        </Link>

        {/* Sidebar Collapse Toggle Button */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              "p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer",
              isCollapsed && "hidden"
            )}
            title="সাইডবার হাইড করুন"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. Navigation Items */}
      <div className={cn(
        "flex-1 overflow-y-auto py-3 space-y-1 scrollbar-thin font-bengali",
        isCollapsed ? "px-2" : "px-3"
      )}>
        {NAV_ITEMS.map((item) => {
          const isActive = isSectionActive(item.section);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={`/${tenantSlug}${item.href}`}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "group flex items-center rounded-xl transition-all font-semibold font-bengali text-sm",
                isCollapsed
                  ? "justify-center p-2.5"
                  : "justify-between px-3 py-2",
                isActive
                  ? "bg-indigo-600 text-white font-bold shadow-xs active"
                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <div className={cn(
                "flex items-center min-w-0",
                isCollapsed ? "justify-center" : "gap-3"
              )}>
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600 group-hover:bg-slate-200 group-hover:text-indigo-600"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!isCollapsed && (
                item.badge ? (
                  item.badge
                ) : (
                  <ChevronRight
                    className={cn(
                      "w-3.5 h-3.5 transition-transform shrink-0",
                      isActive
                        ? "text-white/80 opacity-100"
                        : "text-slate-300 opacity-0 group-hover:opacity-100"
                    )}
                  />
                )
              )}
            </Link>
          );
        })}
      </div>

      {/* 3. Bottom Store Card */}
      <div className={cn(
        "p-2.5 border-t border-slate-100 bg-slate-50/60 shrink-0 font-bengali",
        isCollapsed && "flex justify-center p-2"
      )}>
        {isCollapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
            title="সাইডবার খুলুন"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        ) : (
          <Link
            href={`/${tenantSlug}/settings/profile`}
            className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-white border border-slate-200/90 hover:border-indigo-200 transition-all group shadow-2xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                {storeName ? storeName.charAt(0).toUpperCase() : "M"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                  {storeName || "Mogent Store"}
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  {userEmail || "merchant@store.com"}
                </span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
          </Link>
        )}
      </div>
    </aside>
  );
}
