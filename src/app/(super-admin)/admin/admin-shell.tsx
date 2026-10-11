"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldAlert,
  Activity,
  Users,
  Key,
  DollarSign,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Server,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Layers,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminShellProps {
  children: React.ReactNode;
  serverIp: string;
  totalMerchants: number;
  adminEmail: string;
}

interface NavLink {
  href: string;
  label: string;
  sub: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  group: string;
  links: NavLink[];
}

export function AdminShell({
  children,
  serverIp,
  totalMerchants,
  adminEmail,
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [copiedIp, setCopiedIp] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleCopyIp = () => {
    if (!serverIp) return;
    navigator.clipboard.writeText(serverIp);
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 2000);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore
    } finally {
      window.location.href = "/admin-login";
    }
  };

  const navItems: NavSection[] = [
    {
      group: "PLATFORM & OBSERVABILITY",
      links: [
        {
          href: "/admin",
          label: "Platform Overview",
          sub: "Health, GMV & Live Metrics",
          icon: Activity,
          badge: "Live",
          badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        },
      ],
    },
    {
      group: "ECOSYSTEM & CLIENTS",
      links: [
        {
          href: "/admin/tenants",
          label: "All Merchants",
          sub: "Stores & Direct Impersonation",
          icon: Users,
          badge: `${totalMerchants}`,
          badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
        },
      ],
    },
    {
      group: "GATEWAYS & CONFIGURATION",
      links: [
        {
          href: "/admin/api-settings",
          label: "Master API Keys",
          sub: "AI, SMS, Voice, Payment & S3",
          icon: Key,
        },
        {
          href: "/admin/billing",
          label: "Margins & Pricing",
          sub: "PAYG Profit & Cost Margins",
          icon: DollarSign,
        },
      ],
    },
  ];

  // Breadcrumb generation
  const getBreadcrumbLabel = () => {
    if (pathname === "/admin") return "Overview";
    if (pathname.startsWith("/admin/tenants")) return "Merchants Directory";
    if (pathname.startsWith("/admin/api-settings")) return "Master API Gateways";
    if (pathname.startsWith("/admin/billing")) return "Pricing & Margins";
    return "Master Control";
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans antialiased">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex h-screen w-72 flex-col border-r border-slate-800/80 bg-slate-950/95 backdrop-blur-xl shrink-0">
        {/* Brand Banner */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/40">
              <Crown className="h-5 w-5 text-slate-950 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white tracking-wider">MOGENT MASTER</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                  v2.4
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-400">Enterprise Control Plane</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {navItems.map((sec, idx) => (
            <div key={idx} className="space-y-1.5">
              <span className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                {sec.group}
              </span>
              <div className="space-y-1 pt-1">
                {sec.links.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-150 ${
                        isActive
                          ? "bg-indigo-600/15 text-white border border-indigo-500/30 shadow-sm shadow-indigo-500/10 font-bold"
                          : "text-slate-400 hover:text-white hover:bg-slate-900/70 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                            isActive
                              ? "bg-indigo-600 text-white shadow-xs shadow-indigo-500/40"
                              : "bg-slate-900 text-slate-400 group-hover:text-indigo-300 group-hover:bg-slate-800"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="truncate text-left">
                          <div className="truncate leading-none">{item.label}</div>
                          <div className="text-[10px] text-slate-500 font-normal mt-1 truncate">
                            {item.sub}
                          </div>
                        </div>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0 ${
                            item.badgeColor || "bg-slate-800 text-slate-300 border-slate-700"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quick Shortcuts */}
          <div className="space-y-1.5 pt-2">
            <span className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              STORE PORTAL
            </span>
            <div className="pt-1">
              <Link
                href="/dorita/dashboard"
                target="_blank"
                className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900/70 border border-slate-800/40 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-emerald-400" /> Demo Store Live
                </span>
                <ExternalLink className="h-3 w-3 text-slate-500" />
              </Link>
            </div>
          </div>
        </div>

        {/* Server Outbound IP Whitelist Pill */}
        <div className="px-4 py-3 border-t border-slate-800/80 bg-slate-950">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2 min-w-0">
              <Server className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <div className="truncate">
                <span className="text-slate-400 text-[10px] block font-mono leading-none">SERVER OUTBOUND IP</span>
                <span className="font-mono text-cyan-300 font-bold truncate block mt-0.5">{serverIp}</span>
              </div>
            </div>
            <button
              onClick={handleCopyIp}
              title="Copy IP for bKash/Greenweb whitelisting"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              {copiedIp ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
        </div>

        {/* Admin Identity & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-xs ring-1 ring-white/20 shrink-0">
              SA
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-white block truncate">Super Admin</span>
              <span className="text-[10px] text-slate-400 block truncate">{adminEmail}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Secure Logout"
            className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 transition-all shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] h-full bg-slate-950 border-r border-slate-800 flex flex-col z-10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500 fill-current" />
                <span className="font-extrabold text-sm text-white">MOGENT MASTER</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {navItems.map((sec, idx) => (
                <div key={idx} className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{sec.group}</span>
                  <div className="space-y-1 pt-1">
                    {sec.links.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold ${
                            isActive
                              ? "bg-indigo-600/20 text-white border border-indigo-500/40"
                              : "text-slate-400 hover:bg-slate-900 hover:text-white"
                          }`}
                        >
                          <Icon className="h-4 w-4 text-indigo-400" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Enterprise Top Navigation Bar */}
        <header className="h-16 shrink-0 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between z-10">
          {/* Left: Mobile Toggle & Breadcrumbs */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Super Admin</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
              <span className="text-white font-bold tracking-tight bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800">
                {getBreadcrumbLabel()}
              </span>
            </div>
          </div>

          {/* Right: Operational Status, Server IP Pill & Direct Actions */}
          <div className="flex items-center gap-3">
            {/* Live Systems Operational Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>All Systems Operational</span>
            </div>

            {/* Impersonate Jump button */}
            <Link
              href="/admin/tenants"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-colors"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Login As Merchant</span>
            </Link>

            {/* Exit to Store View */}
            <Link
              href="/"
              target="_blank"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
              title="View Public Homepage"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
