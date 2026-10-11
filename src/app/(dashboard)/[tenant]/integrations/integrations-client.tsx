"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Facebook,
  Instagram,
  MessageSquare,
  ShoppingBag,
  Globe,
  Code2,
  FileSpreadsheet,
  Truck,
  Layers,
  Bot,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Copy,
  Check,
  Key,
  Lock,
  Loader2,
  Wrench,
  Trash2,
  Power,
  Plus,
  Smartphone,
  Sparkles,
  HelpCircle,
  ExternalLink,
  ArrowRight,
  Search,
  RefreshCw,
  Zap,
} from "lucide-react";

import { WhatsAppModal } from "./whatsapp-modal";

interface ChannelItem {
  id: string;
  type: string;
  pageName?: string | null;
  pageId?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export function IntegrationsClient({
  tenantSlug,
  channels,
  isMetaConfigured = false,
  isWhatsAppConfigured = false,
}: {
  tenantSlug: string;
  channels: ChannelItem[];
  isMetaConfigured?: boolean;
  isWhatsAppConfigured?: boolean;
}) {
  const [widgetModalOpen, setWidgetModalOpen] = React.useState(false);
  const [steadfastModalOpen, setSteadfastModalOpen] = React.useState(false);
  const [pathaoModalOpen, setPathaoModalOpen] = React.useState(false);
  const [waModalOpen, setWaModalOpen] = React.useState(false);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = React.useState(false);
  const [maintenanceServiceName, setMaintenanceServiceName] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<"ALL" | "MESSAGING" | "COURIER" | "STORE">("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");

  const [copied, setCopied] = React.useState(false);
  const [allowedDomains, setAllowedDomains] = React.useState("");
  const [steadfastKey, setSteadfastKey] = React.useState("");
  const [steadfastSecret, setSteadfastSecret] = React.useState("");
  const [pathaoClientId, setPathaoClientId] = React.useState("");
  const [pathaoSecret, setPathaoSecret] = React.useState("");

  // WhatsApp Integration State (Meta App ID & Config ID from Master Config)
  const [metaAppId, setMetaAppId] = React.useState("");
  const [metaConfigId, setMetaConfigId] = React.useState("");

  // Connected Channels Management State
  const [channelList, setChannelList] = React.useState<ChannelItem[]>(channels);
  const [togglingChannelId, setTogglingChannelId] = React.useState<string | null>(null);
  const [deletingChannelId, setDeletingChannelId] = React.useState<string | null>(null);
  const [channelActionMsg, setChannelActionMsg] = React.useState<string | null>(null);

  const [waConnected, setWaConnected] = React.useState(
    channels.some((c) => c.type === "WHATSAPP" && c.isActive)
  );

  const [isSteadfastConfigured, setIsSteadfastConfigured] = React.useState(false);
  const [isPathaoConfigured, setIsPathaoConfigured] = React.useState(false);
  const [isMetaReady, setIsMetaReady] = React.useState(isMetaConfigured);
  const [isWaReady, setIsWaReady] = React.useState(isWhatsAppConfigured);
  const [saving, setSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState<string | null>(null);

  const handleToggleChannel = async (channelId: string, currentStatus: boolean) => {
    setTogglingChannelId(channelId);
    setChannelActionMsg(null);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/channels/${channelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update channel");

      setChannelList((prev) =>
        prev.map((c) => (c.id === channelId ? { ...c, isActive: !currentStatus } : c))
      );
      setChannelActionMsg(
        !currentStatus
          ? "পেজটিতে এআই স্বয়ংক্রিয় রিপ্লাই সক্রিয় করা হয়েছে।"
          : "পেজটিতে এআই সাময়িকভাবে পজ করা হয়েছে।"
      );
      setTimeout(() => setChannelActionMsg(null), 3500);
    } catch (err: any) {
      alert(err.message || "সমস্যা হয়েছে।");
    } finally {
      setTogglingChannelId(null);
    }
  };

  const handleDeleteChannel = async (channelId: string, pageName: string) => {
    if (!confirm(`আপনি কি নিশ্চিত যে "${pageName}" পেজটি ডিসকানেক্ট করতে চান?`)) return;

    setDeletingChannelId(channelId);
    setChannelActionMsg(null);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/channels/${channelId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to disconnect channel");

      setChannelList((prev) => prev.filter((c) => c.id !== channelId));
      if (channelList.find((c) => c.id === channelId)?.type === "WHATSAPP") {
        setWaConnected(false);
      }
      setChannelActionMsg(`"${pageName}" সফলভাবে ডিসকানেক্ট করা হয়েছে।`);
      setTimeout(() => setChannelActionMsg(null), 3500);
    } catch (err: any) {
      alert(err.message || "সমস্যা হয়েছে।");
    } finally {
      setDeletingChannelId(null);
    }
  };

  // Load existing config on mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("maintenance") === "FACEBOOK") {
        setMaintenanceServiceName("Facebook & Instagram");
        setMaintenanceModalOpen(true);
      }
    }

    fetch(`/api/tenants/${tenantSlug}/integrations-config`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config) {
          setAllowedDomains(data.config.allowedDomains || "");
          setIsSteadfastConfigured(data.config.steadfastConfigured);
          setIsPathaoConfigured(data.config.pathaoConfigured);
          if (data.config.metaConfigured !== undefined) {
            setIsMetaReady(data.config.metaConfigured);
          }
          if (data.config.whatsappConfigured !== undefined) {
            setIsWaReady(data.config.whatsappConfigured);
          }
          if (data.config.metaAppId) {
            setMetaAppId(data.config.metaAppId);
          }
          if (data.config.metaConfigId) {
            setMetaConfigId(data.config.metaConfigId);
          }
        }
      })
      .catch((err) => console.error("Error loading config:", err));
  }, [tenantSlug]);

  const completeWhatsAppConnection = async (payload: {
    phoneNumberId: string;
    wabaId?: string;
    phoneNumber?: string;
    code?: string;
    accessToken?: string;
  }) => {
    try {
      const res = await fetch("/api/auth/whatsapp/embedded", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          ...payload,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "হোয়াটসঅ্যাপ কানেক্ট করতে সমস্যা হয়েছে।");

      setWaConnected(true);
      if (data.channel) {
        setChannelList((prev) => {
          const filtered = prev.filter((c) => c.type !== "WHATSAPP");
          return [...filtered, data.channel];
        });
      }
      setWaModalOpen(false);
      setSaveSuccess("হোয়াটসঅ্যাপ বিজনেস অ্যাকাউন্ট সফলভাবে সংযুক্ত হয়েছে।");
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (err: any) {
      throw err;
    }
  };

  const isConnected = (type: string) => channelList.some((c) => c.type === type && c.isActive);
  const fbPagesCount = channelList.filter((c) => c.type === "FACEBOOK" || c.type === "INSTAGRAM").length;

  const embedCode = `<script src="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/widget.js" data-tenant="${tenantSlug}" async></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveConfig = async (payload: any) => {
    setSaving(true);
    setSaveSuccess(null);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/integrations-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess("কনফিগারেশন সফলভাবে সেভ হয়েছে!");
        if (payload.allowedDomains !== undefined) setAllowedDomains(payload.allowedDomains);
        if (data.steadfastConfigured !== undefined) setIsSteadfastConfigured(data.steadfastConfigured);
        if (data.pathaoConfigured !== undefined) setIsPathaoConfigured(data.pathaoConfigured);
        setTimeout(() => setSaveSuccess(null), 3000);
      }
    } catch (err) {
      console.error("Save config error:", err);
    } finally {
      setSaving(false);
    }
  };

  const showMaintenance = (serviceName: string) => {
    setMaintenanceServiceName(serviceName);
    setMaintenanceModalOpen(true);
  };

  // Integration Hub Catalog
  const integrationsList = [
    {
      id: "FACEBOOK",
      name: "Facebook & Instagram",
      category: "Meta Omnichannel",
      group: "MESSAGING",
      tag: "Official Meta API",
      desc: "Receive and reply to Messenger and Instagram DMs from one unified inbox, with AI auto-responses and order sync.",
      connected: fbPagesCount > 0,
      actionText: fbPagesCount > 0
        ? `Connected (${fbPagesCount} Page${fbPagesCount > 1 ? "s" : ""}) · Manage`
        : isMetaReady
        ? "1-Click Connect"
        : "Setup Required",
      isMaintenance: !isMetaReady && fbPagesCount === 0,
      renderIcon: () => (
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-rose-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
          <Facebook className="h-6 w-6" />
        </div>
      ),
    },
    {
      id: "WHATSAPP",
      name: "WhatsApp Cloud API",
      category: "Official Meta Cloud",
      group: "MESSAGING",
      tag: "100% Ban-Safe",
      desc: "Connect your WhatsApp Business number to handle chats, orders, and Click-to-WhatsApp (CTWA) ads with 100% ban-safe AI.",
      connected: isConnected("WHATSAPP") || waConnected,
      actionText: (isConnected("WHATSAPP") || waConnected)
        ? "Active (ম্যানেজ / ডিসকানেক্ট)"
        : "1-Click Connect WhatsApp",
      isMaintenance: false,
      renderIcon: () => (
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.075-2.072-.497-1.764-.733-2.888-2.528-2.975-2.645-.088-.116-.719-.956-.719-1.822 0-.866.452-1.292.613-1.468.161-.176.353-.221.47-.221.118 0 .235.002.338.007.108.005.253-.041.396.302.147.353.501 1.222.545 1.311.044.089.074.192.015.309-.059.117-.088.19-.176.294-.088.103-.185.23-.264.309-.089.088-.181.185-.078.362.103.176.458.756.983 1.224.675.602 1.244.788 1.42.876.176.088.279.074.382-.045.103-.117.441-.513.559-.689.118-.176.235-.147.397-.088.162.059 1.03.486 1.206.574.177.089.294.133.338.207.044.074.044.428-.1 1.026z" />
            <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.98-1.306A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.167a8.125 8.125 0 01-4.218-1.177l-.302-.18-2.96.776.79-2.885-.197-.314A8.132 8.132 0 013.833 12c0-4.503 3.664-8.167 8.167-8.167 4.503 0 8.167 3.664 8.167 8.167 0 4.503-3.664 8.167-8.167 8.167z" />
          </svg>
        </div>
      ),
    },
    {
      id: "WEBSITE_CHATBOT",
      name: "Website Chatbot",
      category: "Shadow DOM Widget",
      group: "MESSAGING",
      tag: "Live On-Site AI",
      desc: "Embed an AI chatbot bubble on any HTML, WordPress, Shopify, or custom store with a single line of script.",
      isWidget: true,
      connected: true,
      actionText: "Get Embed Code & Whitelist",
      renderIcon: () => (
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-slate-900 to-indigo-900 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
          <Bot className="h-6 w-6 text-indigo-300" />
        </div>
      ),
    },
    {
      id: "STEADFAST",
      name: "Steadfast Courier",
      category: "Logistics · Nationwide",
      group: "COURIER",
      tag: "Auto Consignment",
      desc: "Automate parcel bookings directly from AI order confirmations. Auto-generate tracking codes and monitor COD.",
      connected: isSteadfastConfigured,
      actionText: isSteadfastConfigured ? "Update API Keys" : "Connect Steadfast API",
      renderIcon: () => (
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center shadow-md shadow-cyan-500/25 shrink-0">
          <Truck className="h-6 w-6" />
        </div>
      ),
    },
    {
      id: "PATHAO",
      name: "Pathao Courier",
      category: "Logistics · Express",
      group: "COURIER",
      tag: "Express Shipping",
      desc: "Direct integration with Pathao Courier. Automatically dispatch orders, fetch real-time rates, and print bulk invoices.",
      connected: isPathaoConfigured,
      actionText: isPathaoConfigured ? "Update API Keys" : "Connect Pathao API",
      renderIcon: () => (
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-600 text-white flex items-center justify-center shadow-md shadow-rose-500/25 shrink-0">
          <Truck className="h-6 w-6" />
        </div>
      ),
    },
    {
      id: "SHOPIFY",
      name: "Shopify Store",
      category: "E-Commerce Platform",
      group: "STORE",
      tag: "2-Way Product Sync",
      desc: "Sync products, inventory, customer tags, and automatically mark abandoned carts directly into Mogent AI.",
      connected: false,
      actionText: "Connect Shopify Store",
      isMaintenance: true,
      renderIcon: () => (
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-700 to-teal-800 text-white flex items-center justify-center shadow-md shrink-0">
          <ShoppingBag className="h-6 w-6 text-emerald-300" />
        </div>
      ),
    },
    {
      id: "WOOCOMMERCE",
      name: "WooCommerce",
      category: "WordPress E-Commerce",
      group: "STORE",
      tag: "Native WP Plugin",
      desc: "Direct REST API connection for WooCommerce. Real-time product feed, variant selection, and automated order placement.",
      connected: false,
      actionText: "Configure Store API",
      isMaintenance: true,
      renderIcon: () => (
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-800 text-white flex items-center justify-center shadow-md shrink-0">
          <Globe className="h-6 w-6 text-purple-300" />
        </div>
      ),
    },
    {
      id: "CUSTOM_STORE",
      name: "Custom Store (API)",
      category: "Developer · REST API",
      group: "STORE",
      tag: "REST Webhook",
      desc: "Two-way sync for Laravel, Next.js, and any custom storefront via our developer SDK or clean REST webhook endpoints.",
      connected: false,
      actionText: "Developer API Documentation",
      isMaintenance: true,
      renderIcon: () => (
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-900 text-white flex items-center justify-center shadow-md shrink-0">
          <Code2 className="h-6 w-6 text-amber-400" />
        </div>
      ),
    },
    {
      id: "GOOGLE_SHEETS",
      name: "Google Sheets",
      category: "Data & Reports",
      group: "STORE",
      tag: "Automated Ledger",
      desc: "Live order and lead stream straight into your private Google Sheets spreadsheet. Zero-delay reconciliation.",
      connected: false,
      actionText: "Connect Google Sheets",
      isMaintenance: true,
      renderIcon: () => (
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-700 text-white flex items-center justify-center shadow-md shrink-0">
          <FileSpreadsheet className="h-6 w-6 text-emerald-200" />
        </div>
      ),
    },
    {
      id: "NUPORT",
      name: "Nuport CRM",
      category: "CRM · Inventory",
      group: "STORE",
      tag: "Multi-Warehouse",
      desc: "Keep prices and stock in step with your Nuport inventory. Products you update in Nuport reflect instantly in AI chats.",
      connected: false,
      actionText: "Sync Inventory",
      isMaintenance: true,
      renderIcon: () => (
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-800 text-white flex items-center justify-center shadow-md shrink-0">
          <Layers className="h-6 w-6 text-slate-300" />
        </div>
      ),
    },
  ];

  // Filtered List
  const filteredIntegrations = integrationsList.filter((item) => {
    const matchesCategory = categoryFilter === "ALL" || item.group === categoryFilter;
    const matchesSearch =
      searchQuery.trim() === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-7">
      
      {/* 1. Master Page Header with Live Cloud Status */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Integrations & Channel Hub
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>All Systems Operational</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            আপনার ফেসবুক পেজ, ইনস্টাগ্রাম, মেটা হোয়াটসঅ্যাপ, কুরিয়ার ও ই-কমার্স স্টোর কানেক্ট করে সম্পূর্ণ অটোমেশন চালু করুন।
          </p>
        </div>

        {/* Action Button: Meta Reconnect */}
        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href={`/api/auth/meta?tenant=${tenantSlug}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-md shadow-blue-600/20 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ফেসবুক ও ইনস্টাগ্রাম পেজ যুক্ত করুন</span>
          </a>
        </div>
      </div>

      {/* 2. Enterprise Cloud Integration Suite Bar */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-gradient-to-r from-emerald-950 via-slate-950 to-slate-900 p-5 sm:p-6 text-white shadow-xl">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>Mogent Cloud Gateway v2.4</span>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
              Enterprise Cloud Integration Suite (১০টি প্ল্যাটফর্ম আনলকড)
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              মেটা অফিশিয়াল ক্লাউড এপিআই, রিয়েল-টাইম কুরিয়ার কনসাইনমেন্ট এবং ইনস্ট্যান্ট ই-কমার্স সিঙ্ক — বাংলাদেশের যেকোনো অনলাইন ব্যবসার জন্য পূর্ণাঙ্গ এআই সমাধান।
            </p>
          </div>

          {/* Real-time stats metric pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
              <span className="text-[10px] text-slate-400 block font-medium">কানেক্টেড পেজ</span>
              <span className="text-lg font-black text-emerald-400 block mt-0.5">{channelList.length}</span>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
              <span className="text-[10px] text-slate-400 block font-medium">হোয়াটসঅ্যাপ ক্লাউড</span>
              <span className="text-lg font-black text-teal-400 block mt-0.5">
                {channelList.some((c) => c.type === "WHATSAPP") ? "Active" : "Ready"}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
              <span className="text-[10px] text-slate-400 block font-medium">কুরিয়ার ট্র্যাকিং</span>
              <span className="text-lg font-black text-cyan-400 block mt-0.5">
                {isSteadfastConfigured || isPathaoConfigured ? "Synced" : "Ready"}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
              <span className="text-[10px] text-slate-400 block font-medium">এপিআই সিকিউরিটি</span>
              <span className="text-lg font-black text-indigo-400 block mt-0.5">Bank-Grade</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Connected Channels & Live Pages Management Section */}
      {channelList.length > 0 && (
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                সংযুক্ত চ্যানেল ও লাইভ এআই অটোমেশন (Connected Channels)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                যেকোনো চ্যানেলের এআই রিপ্লাই যেকোনো সময় এক ক্লিকেই চালু বা সাময়িক পজ করতে পারবেন।
              </p>
            </div>

            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 self-start sm:self-center">
              মোট সক্রিয় চ্যানেল: {channelList.filter((c) => c.isActive).length}/{channelList.length}
            </span>
          </div>

          {channelActionMsg && (
            <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2.5 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{channelActionMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {channelList.map((ch) => {
              const isFb = ch.type === "FACEBOOK";
              const isIg = ch.type === "INSTAGRAM";
              const isWa = ch.type === "WHATSAPP";

              return (
                <div
                  key={ch.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 dark:bg-slate-900/40 dark:border-slate-800/80 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-3">
                    <div
                      className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                        isFb
                          ? "bg-blue-600 text-white"
                          : isIg
                          ? "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white"
                          : isWa
                          ? "bg-gradient-to-tr from-emerald-600 to-teal-500 text-white"
                          : "bg-slate-800 text-white"
                      }`}
                    >
                      {isFb ? (
                        <Facebook className="h-5 w-5" />
                      ) : isIg ? (
                        <Instagram className="h-5 w-5" />
                      ) : isWa ? (
                        <MessageSquare className="h-5 w-5" />
                      ) : (
                        <Bot className="h-5 w-5" />
                      )}
                    </div>

                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {ch.pageName || (isFb ? "Facebook Page" : isIg ? "Instagram Account" : isWa ? "WhatsApp Channel" : "Channel")}
                        </span>
                        
                        <span
                          className={`inline-flex items-center gap-1.5 text-[9px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${
                            ch.isActive
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400"
                              : "bg-slate-500/10 text-slate-500 border-slate-500/30 dark:text-slate-400"
                          }`}
                        >
                          {ch.isActive ? (
                            <>
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                              </span>
                              <span>AI Active</span>
                            </>
                          ) : (
                            <>
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                              <span>Paused</span>
                            </>
                          )}
                        </span>
                      </div>

                      {ch.pageId && (
                        <span className="text-[10px] text-slate-400 font-mono block mt-1 truncate">
                          ID: {ch.pageId}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Toggle Switch & Delete Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleChannel(ch.id, ch.isActive)}
                      disabled={togglingChannelId === ch.id}
                      title={ch.isActive ? "এআই অটো-রিপ্লাই সাময়িক পজ করুন" : "এআই অটো-রিপ্লাই চালু করুন"}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        ch.isActive
                          ? "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                          : "bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border border-border"
                      }`}
                    >
                      {togglingChannelId === ch.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Power className="h-3.5 w-3.5" />
                      )}
                      <span>{ch.isActive ? "Pause" : "Resume"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteChannel(ch.id, ch.pageName || "পেজ")}
                      disabled={deletingChannelId === ch.id}
                      title="চ্যানেলটি ডিসকানেক্ট করুন"
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      {deletingChannelId === ch.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Controls Bar: Category Filter Pills & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "ALL", label: "All Integrations", count: 10 },
            { id: "MESSAGING", label: "Messaging & Social", count: 3 },
            { id: "COURIER", label: "Courier & Logistics", count: 2 },
            { id: "STORE", label: "Storefronts & CRM", count: 5 },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategoryFilter(tab.id as any)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                categoryFilter === tab.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md"
                  : "bg-slate-100 hover:bg-slate-200/80 text-slate-600 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white border border-transparent dark:border-slate-800"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  categoryFilter === tab.id
                    ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-950"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Live Search Input */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="প্ল্যাটফর্ম বা কুরিয়ার খুঁজুন..."
            className="pl-9 pr-3 h-10 rounded-2xl text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950"
          />
        </div>
      </div>

      {/* 5. Master Integration Hub Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredIntegrations.map((item) => {
          return (
            <div
              key={item.id}
              className="group flex flex-col justify-between rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 sm:p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 relative overflow-hidden"
            >
              {/* Subtle Ambient Hover Border Glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

              <div>
                {/* Card Top: Icon & Status Badge */}
                <div className="flex items-start justify-between mb-4">
                  {item.renderIcon()}

                  {item.connected ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                      </span>
                      <span>Connected</span>
                    </span>
                  ) : item.isMaintenance ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400">
                      <Wrench className="w-3 h-3 text-slate-400" />
                      <span>Maintenance</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                      <span>Ready to Connect</span>
                    </span>
                  )}
                </div>

                {/* Title & Tag */}
                <div className="space-y-1 mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {item.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800">
                      {item.tag}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 block">
                    {item.category}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              {/* Action Button at Bottom */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                {item.isWidget ? (
                  <button
                    type="button"
                    onClick={() => setWidgetModalOpen(true)}
                    className="w-full py-2.5 px-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-2 cursor-pointer transition-colors group/btn"
                  >
                    <span>{item.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                  </button>
                ) : item.id === "STEADFAST" ? (
                  <button
                    type="button"
                    onClick={() => setSteadfastModalOpen(true)}
                    className="w-full py-2.5 px-3 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 text-xs font-bold text-cyan-700 dark:text-cyan-300 flex items-center justify-center gap-2 cursor-pointer transition-colors group/btn"
                  >
                    <span>{item.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                  </button>
                ) : item.id === "PATHAO" ? (
                  <button
                    type="button"
                    onClick={() => setPathaoModalOpen(true)}
                    className="w-full py-2.5 px-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center justify-center gap-2 cursor-pointer transition-colors group/btn"
                  >
                    <span>{item.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                  </button>
                ) : item.id === "WHATSAPP" ? (
                  <button
                    type="button"
                    onClick={() => setWaModalOpen(true)}
                    className="w-full py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 transition-all active:scale-[0.98] group/btn"
                  >
                    <span>{item.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                  </button>
                ) : item.isMaintenance ? (
                  <button
                    type="button"
                    onClick={() => showMaintenance(item.name)}
                    className="w-full py-2.5 px-3 rounded-2xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 cursor-pointer transition-colors group/btn"
                  >
                    <span>{item.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (item.id === "FACEBOOK") {
                        if (!isMetaReady) {
                          showMaintenance("Facebook & Instagram");
                        } else {
                          window.location.href = `/api/auth/meta?tenant=${tenantSlug}`;
                        }
                      } else {
                        showMaintenance(item.name);
                      }
                    }}
                    className="w-full py-2.5 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all active:scale-[0.98] group/btn"
                  >
                    <span>{item.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 6. Website Chatbot Embed & Whitelist Modal */}
      <Dialog
        open={widgetModalOpen}
        onOpenChange={setWidgetModalOpen}
        className="max-w-xl p-0 overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl"
      >
        <DialogClose onClose={() => setWidgetModalOpen(false)} />

        <div className="p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white border-b border-indigo-900/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white">
                Website Chatbot Embed & Security
              </h3>
              <p className="text-xs text-slate-300">
                যেকোনো ওয়েবসাইটে মাত্র ১ লাইনের স্ক্রিপ্ট দিয়ে এআই চ্যাট উইজেট বসান।
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {saveSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-2xl flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{saveSuccess}</span>
            </div>
          )}

          <div>
            <label className="font-extrabold text-slate-800 dark:text-slate-200 block mb-1">
              ১. উইজেট স্ক্রিপ্ট কোড (Embed Code)
            </label>
            <p className="text-slate-500 mb-2">
              নিচের কোডটি কপি করে আপনার ওয়েবসাইটের `&lt;head&gt;` বা `&lt;body&gt;` ট্যাগে পেস্ট করুন:
            </p>
            <div className="relative rounded-2xl bg-slate-950 p-4 text-slate-100 font-mono text-[11px] break-all border border-slate-800">
              {embedCode}
              <button
                type="button"
                onClick={handleCopy}
                className="absolute right-3 top-3 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                title="কোড কপি করুন"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              ২. অনুমোদিত ডোমেইন তালিকা (Domain Whitelist Security)
            </label>
            <p className="text-slate-500 mb-2">
              আপনার অনুমোদিত ওয়েবসাইট ডোমেইন লিখুন (একাধিক হলে কমা দিয়ে লিখুন, যেমন: `myshop.com, fashionhub.com.bd, localhost`)।
            </p>
            <div className="flex gap-2">
              <Input
                value={allowedDomains}
                onChange={(e) => setAllowedDomains(e.target.value)}
                placeholder="যেমন: myshop.com, mystore.com.bd"
                className="text-xs flex-1 rounded-2xl"
              />
              <Button
                type="button"
                onClick={() => handleSaveConfig({ allowedDomains })}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold px-4 cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "সেভ করুন"}
              </Button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* 7. Steadfast Courier API Key Modal */}
      <Dialog
        open={steadfastModalOpen}
        onOpenChange={setSteadfastModalOpen}
        className="max-w-lg p-0 overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl"
      >
        <DialogClose onClose={() => setSteadfastModalOpen(false)} />

        <div className="p-6 bg-gradient-to-br from-cyan-950 via-slate-950 to-slate-900 text-white border-b border-cyan-900/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white">
                Steadfast Courier API Integration
              </h3>
              <p className="text-xs text-slate-300">
                স্বয়ংক্রিয় পার্সেল বুকিং ও ট্র্যাকিংয়ের জন্য আপনার মার্চেন্ট এপিআই কি দিন।
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {saveSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-2xl flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{saveSuccess}</span>
            </div>
          )}

          <div>
            <label className="font-extrabold text-slate-800 dark:text-slate-200 block mb-1">
              Steadfast API Key
            </label>
            <Input
              type="text"
              value={steadfastKey}
              onChange={(e) => setSteadfastKey(e.target.value)}
              placeholder="Enter Steadfast API Key"
              className="text-xs rounded-2xl"
            />
          </div>

          <div>
            <label className="font-extrabold text-slate-800 dark:text-slate-200 block mb-1">
              Steadfast Secret Key
            </label>
            <Input
              type="password"
              value={steadfastSecret}
              onChange={(e) => setSteadfastSecret(e.target.value)}
              placeholder="Enter Steadfast Secret Key"
              className="text-xs rounded-2xl"
            />
          </div>

          <Button
            type="button"
            onClick={() =>
              handleSaveConfig({
                steadfastApiKey: steadfastKey,
                steadfastSecretKey: steadfastSecret,
              })
            }
            disabled={saving || !steadfastKey || !steadfastSecret}
            className="w-full h-11 bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl text-xs font-bold mt-2 cursor-pointer shadow-md shadow-cyan-600/20"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Steadfast API কানেক্ট করুন"}
          </Button>
        </div>
      </Dialog>

      {/* 8. Pathao Courier API Key Modal */}
      <Dialog
        open={pathaoModalOpen}
        onOpenChange={setPathaoModalOpen}
        className="max-w-lg p-0 overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl"
      >
        <DialogClose onClose={() => setPathaoModalOpen(false)} />

        <div className="p-6 bg-gradient-to-br from-rose-950 via-slate-950 to-slate-900 text-white border-b border-rose-900/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-rose-600/30 border border-rose-500/40 flex items-center justify-center text-rose-300">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white">
                Pathao Courier API Integration
              </h3>
              <p className="text-xs text-slate-300">
                পাঠাও মার্চেন্ট ডেভেলপার পোর্টাল থেকে প্রাপ্ত ক্রেডেনশিয়াল প্রদান করুন।
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {saveSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-2xl flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{saveSuccess}</span>
            </div>
          )}

          <div>
            <label className="font-extrabold text-slate-800 dark:text-slate-200 block mb-1">
              Pathao Client ID
            </label>
            <Input
              type="text"
              value={pathaoClientId}
              onChange={(e) => setPathaoClientId(e.target.value)}
              placeholder="Enter Pathao Client ID"
              className="text-xs rounded-2xl"
            />
          </div>

          <div>
            <label className="font-extrabold text-slate-800 dark:text-slate-200 block mb-1">
              Pathao Client Secret
            </label>
            <Input
              type="password"
              value={pathaoSecret}
              onChange={(e) => setPathaoSecret(e.target.value)}
              placeholder="Enter Pathao Client Secret"
              className="text-xs rounded-2xl"
            />
          </div>

          <Button
            type="button"
            onClick={() =>
              handleSaveConfig({
                pathaoClientId: pathaoClientId,
                pathaoClientSecret: pathaoSecret,
              })
            }
            disabled={saving || !pathaoClientId || !pathaoSecret}
            className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold mt-2 cursor-pointer shadow-md shadow-rose-600/20"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pathao API কানেক্ট করুন"}
          </Button>
        </div>
      </Dialog>

      {/* 9. Standalone Animated WhatsApp Cloud Modal (Pure 1-Click Plug & Play) */}
      <WhatsAppModal
        open={waModalOpen}
        onOpenChange={setWaModalOpen}
        tenantSlug={tenantSlug}
        metaAppId={metaAppId}
        metaConfigId={metaConfigId}
        isConnected={channelList.some((c) => c.type === "WHATSAPP")}
        connectedChannel={channelList.find((c) => c.type === "WHATSAPP") || null}
        onCompleteConnection={completeWhatsAppConnection}
        onDisconnect={handleDeleteChannel}
      />

      {/* 10. Friendly Maintenance / Admin Guidance Modal */}
      <Dialog
        open={maintenanceModalOpen}
        onOpenChange={setMaintenanceModalOpen}
        className="max-w-lg p-0 overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl"
      >
        <DialogClose onClose={() => setMaintenanceModalOpen(false)} />

        <div className="p-6 bg-gradient-to-br from-amber-950 via-slate-950 to-slate-900 text-white border-b border-amber-900/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-600/30 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white">
                প্ল্যাটফর্ম সেটআপ নির্দেশনা
              </h3>
              <p className="text-xs text-slate-300">
                {maintenanceServiceName} সংযোগ সংক্রান্ত তথ্য
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {maintenanceServiceName.includes("Facebook") ? (
            <p>
              <strong>Meta / Facebook App ID ও Secret Key</strong> কেন্দ্রীয়ভাবে সুপার অ্যাডমিন প্যানেল থেকে সক্রিয় করা প্রয়োজন।
            </p>
          ) : maintenanceServiceName.includes("WhatsApp") ? (
            <p>
              <strong>WhatsApp Cloud API</strong> সার্ভিসটি সক্রিয় করতে সুপার অ্যাডমিন প্যানেল থেকে Meta WhatsApp Business API কনফিগারেশন সেট করুন।
            </p>
          ) : (
            <p>
              <strong>{maintenanceServiceName}</strong> প্ল্যাটফর্মটি বর্তমানে আপগ্রেডেশন বা মেইন্টেনেন্স মোডে রয়েছে।
            </p>
          )}

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 text-[11px] dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-extrabold block text-xs">সুপার এডমিন নির্দেশনা:</span>
              <span>
                আপনি সুপার অ্যাডমিন হলে <a href="/admin/api-settings" className="font-bold underline text-amber-700 dark:text-amber-300">Master API Settings</a>-এ গিয়ে কেন্দ্রীয় এপিআই কি ও সিক্রেট ইনপুট দিন। সেভ করার সাথে সাথেই সকল মার্চেন্ট স্টোরে ১-ক্লিকে সংযোগ চালু হয়ে যাবে।
              </span>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setMaintenanceModalOpen(false)}
            className="w-full h-11 bg-slate-900 text-white hover:bg-slate-800 rounded-2xl text-xs font-bold cursor-pointer"
          >
            বুঝেছি
          </Button>
        </div>
      </Dialog>

    </div>
  );
}
