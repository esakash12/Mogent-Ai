"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { formatCurrencyBdt } from "@/lib/utils";
import {
  Store,
  Wallet,
  CheckCircle2,
  Phone,
  LogOut,
  MessageCircle,
  Mail,
  ExternalLink,
  LifeBuoy,
  Menu,
  Search,
  Zap,
  ShieldCheck,
  Globe,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { NotificationDropdown } from "./notification-dropdown";
import { useLanguage } from "@/lib/language-context";
import { useToast } from "@/lib/toast-context";

interface HeaderProps {
  tenantName: string;
  tenantSlug: string;
  walletBalanceBdt: number;
  initialAiActive: boolean;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
  onOpenMobileMenu?: () => void;
  onOpenCommand?: () => void;
}

export function Header({
  tenantName,
  tenantSlug,
  walletBalanceBdt,
  initialAiActive,
  isSidebarCollapsed = false,
  onToggleSidebarCollapse,
  onOpenMobileMenu,
  onOpenCommand,
}: HeaderProps) {
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();
  const { toast } = useToast();
  const [aiActive, setAiActive] = React.useState(initialAiActive);
  const [topupOpen, setTopupOpen] = React.useState(false);
  const [supportOpen, setSupportOpen] = React.useState(false);
  const [balance, setBalance] = React.useState(walletBalanceBdt);
  const [rechargeAmount, setRechargeAmount] = React.useState("500");
  const [selectedGateway, setSelectedGateway] = React.useState<"bkash" | "nagad">("bkash");
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore
    } finally {
      window.location.href = "/login";
    }
  };

  // Toggle AI Active status in real-time
  const handleToggleAi = async (newState: boolean) => {
    setAiActive(newState);
    try {
      await fetch(`/api/tenants/${tenantSlug}/ai-toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiActive: newState }),
      });
      if (newState) {
        toast.success("এআই অটো-রিপ্লাই সফলভাবে সক্রিয় করা হয়েছে।");
      } else {
        toast.info("এআই অটো-রিপ্লাই সাময়িকভাবে পজ করা হয়েছে।");
      }
    } catch (err) {
      console.error("Failed to toggle AI status:", err);
    }
  };

  // Instant recharge via bKash/Nagad modal
  const handleRecharge = async () => {
    setIsUpdating(true);
    const amount = parseFloat(rechargeAmount) || 0;
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/wallet-topup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.newBalance);
        setTopupOpen(false);
        toast.success(`৳${amount} ওয়ালেটে সফলভাবে রিচার্জ হয়েছে।`);
      }
    } catch (err) {
      console.error("Topup error:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/90 bg-white/95 px-5 sm:px-6 backdrop-blur-md font-body shadow-2xs">
        {/* Left: Store Switcher, Sidebar Toggle & Search */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Menu Trigger */}
          {onOpenMobileMenu && (
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="flex md:hidden p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Open Navigation"
            >
              <Menu className="h-4 w-4" />
            </button>
          )}

          {/* Desktop Sidebar Collapse / Expand Toggle */}
          {onToggleSidebarCollapse && (
            <button
              type="button"
              onClick={onToggleSidebarCollapse}
              className="hidden md:flex p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all cursor-pointer shadow-2xs"
              title={isSidebarCollapsed ? "সাইডবার দেখান (Expand)" : "সাইডবার হাইড করুন (Collapse)"}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="h-4 w-4 text-indigo-600" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          )}

          {/* Store Name Badge */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 shadow-2xs font-bengali">
            <Store className="h-4 w-4 text-indigo-600 shrink-0" />
            <span className="font-bold text-xs sm:text-sm text-slate-900 truncate max-w-[120px] sm:max-w-none">
              {tenantName}
            </span>
            <span className="flex items-center text-indigo-600" title="Meta & Mogent Verified Store">
              <ShieldCheck className="h-4 w-4" />
            </span>
          </div>

          {/* Quick Command Palette Search Button */}
          {onOpenCommand && (
            <button
              type="button"
              onClick={onOpenCommand}
              className="hidden lg:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors cursor-pointer ml-1 font-bengali"
              title="Search or Jump (Ctrl + K)"
            >
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[11px] font-semibold text-slate-600">
                {lang === "bn" ? "ফিচার খুঁজুন..." : "Search features..."}
              </span>
              <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.2 text-[9px] font-bold text-slate-500 font-mono shadow-2xs">
                Ctrl K
              </kbd>
            </button>
          )}
        </div>

        {/* Right: Wallet, AI Autopilot Switch, Language, Notifications, Logout */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Wallet Balance Pill */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/70 px-2.5 py-1 shadow-2xs font-bengali">
            <Wallet className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 font-medium">{t("header.wallet")}:</span>
              <span className="font-bold text-slate-900 font-mono text-xs">
                {formatCurrencyBdt(balance)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setTopupOpen(true)}
              className="ml-0.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white px-1.5 py-0.5 text-[10px] font-bold transition-colors cursor-pointer"
            >
              {t("header.topup")}
            </button>
          </div>

          {/* AI Master Active Toggle Switch */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 shadow-2xs font-bengali">
            <span className="relative flex h-2 w-2">
              {aiActive ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400" />
              )}
            </span>
            <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
              {t("header.ai_active")}
            </span>
            <Switch
              checked={aiActive}
              onCheckedChange={handleToggleAi}
              label="AI Status Toggle"
            />
          </div>

          {/* Language Switcher */}
          <button
            type="button"
            onClick={() => setLang(lang === "bn" ? "en" : "bn")}
            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
            title="ভাষা পরিবর্তন করুন"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-[11px]">{lang === "bn" ? "বাং" : "EN"}</span>
          </button>

          {/* Interactive Notification Dropdown */}
          <NotificationDropdown
            tenantSlug={tenantSlug}
            onOpenTopup={() => setTopupOpen(true)}
          />

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer font-bengali shadow-2xs"
            title={t("header.logout")}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("header.logout")}</span>
          </button>
        </div>
      </header>

      {/* Wallet Top-up Modal (Clean Light SaaS) */}
      <Dialog
        open={topupOpen}
        onOpenChange={setTopupOpen}
        className="max-w-md p-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl font-bengali"
      >
        <DialogClose onClose={() => setTopupOpen(false)} />

        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {lang === "bn" ? "ওয়ালেট রিচার্জ করুন" : "Recharge Wallet Balance"}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === "bn" ? "বর্তমান ব্যালেন্স: " : "Current balance: "}
                <span className="font-bold text-indigo-600 font-mono">{formatCurrencyBdt(balance)}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              {lang === "bn" ? "রিচার্জের পরিমাণ নির্বাচন করুন" : "Select Recharge Amount"}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {["200", "500", "1000", "2000"].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setRechargeAmount(amt)}
                  className={`py-2 rounded-xl font-bold font-mono transition-all border cursor-pointer ${
                    rechargeAmount === amt
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  ৳{amt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              {lang === "bn" ? "পেমেন্ট মাধ্যম" : "Payment Gateway"}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedGateway("bkash")}
                className={`p-3 rounded-xl border flex items-center gap-2.5 font-bold transition-all cursor-pointer ${
                  selectedGateway === "bkash"
                    ? "border-pink-500 bg-pink-50/50 text-pink-700 shadow-2xs"
                    : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="w-6 h-6 rounded-md bg-pink-600 text-white flex items-center justify-center text-[10px] font-black">
                  bK
                </div>
                <span>বিকাশ (bKash)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedGateway("nagad")}
                className={`p-3 rounded-xl border flex items-center gap-2.5 font-bold transition-all cursor-pointer ${
                  selectedGateway === "nagad"
                    ? "border-orange-500 bg-orange-50/50 text-orange-700 shadow-2xs"
                    : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="w-6 h-6 rounded-md bg-orange-600 text-white flex items-center justify-center text-[10px] font-black">
                  ন
                </div>
                <span>নগদ (Nagad)</span>
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={isUpdating}
              onClick={handleRecharge}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>প্রসেসিং হচ্ছে...</span>
                </>
              ) : (
                <>
                  <span>৳{rechargeAmount} টাকা তাৎক্ষণিক রিচার্জ করুন</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
