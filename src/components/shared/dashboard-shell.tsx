"use client";

import * as React from "react";
import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import { CommandPalette } from "@/components/shared/command-palette";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";

interface DashboardShellProps {
  tenantSlug: string;
  tenantName: string;
  userEmail?: string;
  walletBalanceBdt: number;
  initialAiActive: boolean;
  isImpersonating?: boolean;
  children: React.ReactNode;
}

export function DashboardShell({
  tenantSlug,
  tenantName,
  userEmail,
  walletBalanceBdt,
  initialAiActive,
  isImpersonating,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  // Restore saved collapse state from localStorage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("mogent_sidebar_collapsed");
      if (saved) setSidebarCollapsed(JSON.parse(saved));
    } catch {
      // Ignore
    }
  }, []);

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("mogent_sidebar_collapsed", JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  // Auto-close mobile drawer on route navigation
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8FAFC] text-slate-900 font-body">
      {/* 1. Desktop Sidebar (Collapsible & Persistent) */}
      <div className="hidden md:flex shrink-0">
        <Sidebar
          tenantSlug={tenantSlug}
          storeName={tenantName}
          userEmail={userEmail}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />
      </div>

      {/* 2. Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Sidebar */}
          <div className="relative z-50 flex flex-col w-64 bg-white shadow-2xl animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-3.5 right-3.5 p-1 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              title="Close Menu"
            >
              <X className="h-4 w-4" />
            </button>
            <Sidebar
              tenantSlug={tenantSlug}
              storeName={tenantName}
              userEmail={userEmail}
              className="border-none w-full"
            />
          </div>
        </div>
      )}

      {/* 3. Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Super Admin Impersonation Notice Banner */}
        {isImpersonating && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-sm z-30 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-base">🛡️</span>
              <span>
                সুপার অ্যাডমিন ইমপারসোনেশন মোড: আপনি বর্তমানে &ldquo;{tenantName}&rdquo; (/{tenantSlug}) মার্চেন্টের অ্যাকাউন্টে অ্যাক্সেস নিয়ে আছেন।
              </span>
            </div>
            <a
              href="/admin/tenants"
              className="bg-slate-950 text-white hover:bg-slate-900 px-3 py-1 rounded-md text-[11px] font-semibold transition shrink-0 ml-2"
            >
              সুপার অ্যাডমিনে ফিরুন &rarr;
            </a>
          </div>
        )}

        {/* Top Header */}
        <Header
          tenantName={tenantName}
          tenantSlug={tenantSlug}
          walletBalanceBdt={walletBalanceBdt}
          initialAiActive={initialAiActive}
          isSidebarCollapsed={sidebarCollapsed}
          onToggleSidebarCollapse={toggleSidebarCollapse}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenCommand={() => setCommandOpen(true)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 bg-[#F8FAFC]">
          {children}
        </main>
      </div>

      {/* 4. Global Command Palette (Ctrl+K) */}
      <CommandPalette
        tenantSlug={tenantSlug}
        open={commandOpen}
        onOpenChange={setCommandOpen}
      />
    </div>
  );
}
