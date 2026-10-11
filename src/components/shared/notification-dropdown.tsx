"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  ShoppingBag,
  AlertTriangle,
  Plug,
  Package,
  X,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";

interface NotificationItem {
  id: string;
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  type: "order" | "wallet" | "integration" | "stock";
  timeBn: string;
  timeEn: string;
  read: boolean;
  link?: string;
  actionType?: "topup";
}

interface NotificationDropdownProps {
  tenantSlug: string;
  onOpenTopup?: () => void;
}

const initialNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    titleBn: "নতুন অর্ডার প্লেস হয়েছে!",
    titleEn: "New Order Placed!",
    descBn: "মো: রাহিম ফেসবুক পেজ থেকে ১টি প্রডাক্ট অর্ডার করেছেন (৳১,৪৫০)।",
    descEn: "Md. Rahim placed an order via Facebook Page (৳1,450).",
    type: "order",
    timeBn: "১০ মিনিট আগে",
    timeEn: "10m ago",
    read: false,
    link: "/sales/orders",
  },
  {
    id: "notif-2",
    titleBn: "AI ওয়ালেট ব্যালেন্স সতর্কতা",
    titleEn: "AI Wallet Low Balance Alert",
    descBn: "আপনার ওয়ালেট ব্যালেন্স কমে এসেছে। মেসেজিং সচল রাখতে রিচার্জ করুন।",
    descEn: "Your wallet balance is low. Recharge to ensure uninterrupted AI responses.",
    type: "wallet",
    timeBn: "১ ঘণ্টা আগে",
    timeEn: "1h ago",
    read: false,
    actionType: "topup",
  },
  {
    id: "notif-3",
    titleBn: "মেটা চ্যানেল সক্রিয়",
    titleEn: "Meta Channel Active",
    descBn: "Facebook ও Instagram পেজে ১-ক্লিক অটোমেশন সফলভাবে সংযুক্ত হয়েছে।",
    descEn: "Facebook and Instagram 1-click automation connected successfully.",
    type: "integration",
    timeBn: "৩ ঘণ্টা আগে",
    timeEn: "3h ago",
    read: false,
    link: "/integrations",
  },
  {
    id: "notif-4",
    titleBn: "ইনভেন্টরি স্টক সতর্কতা",
    titleEn: "Low Inventory Warning",
    descBn: "প্রিমিয়াম ব্ল্যাক টি-শার্টের স্টক ৩টির নিচে নেমে এসেছে।",
    descEn: "Premium Black T-Shirt stock has fallen below 3 units.",
    type: "stock",
    timeBn: "গতকাল",
    timeEn: "Yesterday",
    read: true,
    link: "/sales/products",
  },
];

export function NotificationDropdown({ tenantSlug, onOpenTopup }: NotificationDropdownProps) {
  const { lang } = useLanguage();
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Fetch real notifications from database
  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/notifications`);
      if (res.ok) {
        const data = await res.json();
        if (data.notifications && Array.isArray(data.notifications)) {
          const mapped: NotificationItem[] = data.notifications.map((n: any) => ({
            id: n.id,
            titleBn: n.title,
            titleEn: n.title,
            descBn: n.message,
            descEn: n.message,
            type: n.type === "HUMAN_TAKEOVER" ? "wallet" : n.type === "ORDER" ? "order" : "integration",
            timeBn: new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            timeEn: new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            read: n.isRead,
            link: n.type === "HUMAN_TAKEOVER" ? "/inbox" : n.type === "ORDER" ? "/sales/orders" : undefined,
          }));
          setNotifications(mapped);
        }
      }
    } catch {
      // Ignore background errors
    }
  }, [tenantSlug]);

  React.useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 8000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Click outside listener to auto-close dropdown
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetch(`/api/tenants/${tenantSlug}/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
    } catch {}
  };

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await fetch(`/api/tenants/${tenantSlug}/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {}
  };

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "order":
        return <ShoppingBag className="h-4 w-4 text-emerald-600" />;
      case "wallet":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case "integration":
        return <Plug className="h-4 w-4 text-indigo-600" />;
      case "stock":
        return <Package className="h-4 w-4 text-rose-600" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button Toggle */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "relative rounded-xl border p-2 transition-colors cursor-pointer",
          open
            ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
            : "border-border/80 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"
        )}
        title={lang === "bn" ? "বিজ্ঞপ্তি" : "Notifications"}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Floating Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border/90 bg-white/95 dark:bg-slate-950/95 p-4 shadow-2xl backdrop-blur-md z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {lang === "bn" ? "বিজ্ঞপ্তি" : "Notifications"}
              </h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 px-2 py-0.5 text-[10px] font-bold">
                  {unreadCount} {lang === "bn" ? "নতুন" : "New"}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>{lang === "bn" ? "সব পঠিত" : "Mark all read"}</span>
              </button>
            )}
          </div>

          {/* List of Notifications */}
          <div className="mt-2 max-h-80 overflow-y-auto divide-y divide-border/60 scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                {lang === "bn" ? "কোনো বিজ্ঞপ্তি নেই" : "No notifications"}
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer",
                    n.read
                      ? "hover:bg-slate-50 dark:hover:bg-slate-900/40 opacity-75"
                      : "bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50/70"
                  )}
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-slate-900 shadow-xs border border-border/70">
                    {getIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={cn("text-xs font-bold text-slate-900 dark:text-white truncate", !n.read && "text-indigo-700 dark:text-indigo-300")}>
                        {lang === "bn" ? n.titleBn : n.titleEn}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                        {lang === "bn" ? n.timeBn : n.timeEn}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                      {lang === "bn" ? n.descBn : n.descEn}
                    </p>

                    {/* Action Links */}
                    {n.link && (
                      <Link
                        href={`/${tenantSlug}${n.link}`}
                        onClick={() => setOpen(false)}
                        className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <span>{lang === "bn" ? "বিস্তারিত দেখুন" : "View Details"}</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    )}

                    {n.actionType === "topup" && onOpenTopup && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          onOpenTopup();
                        }}
                        className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs hover:bg-amber-600 transition-colors"
                      >
                        <span>{lang === "bn" ? "ব্যালেন্স রিচার্জ করুন" : "Recharge Wallet"}</span>
                      </button>
                    )}
                  </div>

                  {!n.read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
