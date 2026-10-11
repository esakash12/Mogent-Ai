"use client";

import * as React from "react";
import { formatCurrencyBdt } from "@/lib/utils";
import { Dialog, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Flame,
  Target,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Facebook,
  Instagram,
  CheckCircle2,
  Plus,
  Trash2,
  Calculator,
  Calendar,
  AlertCircle,
  HelpCircle,
  Zap,
  ShieldCheck,
  Settings2,
  Activity,
  Send,
  Loader2,
} from "lucide-react";
import { useToast } from "@/lib/toast-context";

export interface PixelConfig {
  metaPixelId: string;
  metaCapiTokenMasked: string;
  hasCapiToken: boolean;
  metaTestEventCode: string;
  metaAdAccountId: string;
  isConfigured: boolean;
}

interface AdSpendItem {
  id: string;
  amount: number;
  date: string;
  campaignName?: string | null;
  platform: string;
  notes?: string | null;
}

interface MetaOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string | null;
  totalAmount: number;
  channel: string;
  status: string;
  createdAt: string;
}

interface AdsFlowClientProps {
  tenantSlug: string;
  initialOrders: MetaOrder[];
  initialSpends: AdSpendItem[];
  metaChannelsCount: number;
  initialPixelConfig: PixelConfig;
}

export function AdsFlowClient({
  tenantSlug,
  initialOrders,
  initialSpends,
  metaChannelsCount,
  initialPixelConfig,
}: AdsFlowClientProps) {
  const { toast } = useToast();
  const [orders, setOrders] = React.useState<MetaOrder[]>(initialOrders);
  const [spends, setSpends] = React.useState<AdSpendItem[]>(initialSpends);
  const [logSpendOpen, setLogSpendOpen] = React.useState(false);

  // Meta Pixel & CAPI states
  const [pixelConfig, setPixelConfig] = React.useState<PixelConfig>(initialPixelConfig);
  const [pixelModalOpen, setPixelModalOpen] = React.useState(false);
  const [pixelIdInput, setPixelIdInput] = React.useState(initialPixelConfig.metaPixelId);
  const [capiTokenInput, setCapiTokenInput] = React.useState("");
  const [testEventCodeInput, setTestEventCodeInput] = React.useState(initialPixelConfig.metaTestEventCode);
  const [adAccountIdInput, setAdAccountIdInput] = React.useState(initialPixelConfig.metaAdAccountId);
  const [isSavingPixel, setIsSavingPixel] = React.useState(false);
  const [isSendingTestEvent, setIsSendingTestEvent] = React.useState(false);
  const [testEventFeedback, setTestEventFeedback] = React.useState<{
    success: boolean;
    message: string;
    eventsReceived?: number;
    fbtraceId?: string;
  } | null>(null);

  // Form states for Logging Ad Spend
  const [spendAmount, setSpendAmount] = React.useState("");
  const [spendDate, setSpendDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [campaignName, setCampaignName] = React.useState("Facebook Messenger Boost");
  const [platform, setPlatform] = React.useState("FACEBOOK");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Interactive Simulator state
  const [simBudget, setSimBudget] = React.useState(1000);
  const [simRoas, setSimRoas] = React.useState(4.0);

  // Calculate Metrics
  const totalAttributedRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalAdSpend = spends.reduce((sum, s) => sum + s.amount, 0);
  const orderCount = orders.length;

  // Blended ROAS
  const blendedRoas = totalAdSpend > 0 ? totalAttributedRevenue / totalAdSpend : 0;

  // Cost Per Purchase (CPP / CPA)
  const cpp = orderCount > 0 && totalAdSpend > 0 ? totalAdSpend / orderCount : 0;

  // Estimated Net Ad Margin (Assuming 60% gross margin minus ad spend)
  const estimatedNetMargin = totalAttributedRevenue > 0
    ? totalAttributedRevenue * 0.45 - totalAdSpend
    : 0;

  const handleLogSpend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spendAmount || isNaN(parseFloat(spendAmount))) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/ad-spend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(spendAmount),
          date: spendDate,
          campaignName,
          platform,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.adSpend) {
          setSpends([data.adSpend, ...spends]);
          toast.success("বিজ্ঞাপন খরচ সফলভাবে যুক্ত হয়েছে!");
          setSpendAmount("");
          setLogSpendOpen(false);
        }
      } else {
        toast.error("বিজ্ঞাপন খরচ সেভ করতে সমস্যা হয়েছে");
      }
    } catch (err) {
      console.error("Failed to log ad spend:", err);
      toast.error("সার্ভার সমস্যা, আবার চেষ্টা করুন");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSpend = async (id: string) => {
    if (!confirm("আপনি কি এই খরচের হিসাবটি মুছে ফেলতে চান?")) return;

    setSpends((prev) => prev.filter((s) => s.id !== id));
    try {
      await fetch(`/api/tenants/${tenantSlug}/ad-spend?id=${id}`, {
        method: "DELETE",
      });
      toast.success("খরচের রেকর্ড মুছে ফেলা হয়েছে");
    } catch (err) {
      console.error("Failed to delete spend:", err);
      toast.error("মুছতে সমস্যা হয়েছে");
    }
  };

  const handleSavePixelConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPixel(true);
    try {
      const payload: any = {
        metaPixelId: pixelIdInput,
        metaTestEventCode: testEventCodeInput,
        metaAdAccountId: adAccountIdInput,
      };
      if (capiTokenInput.trim().length > 0) {
        payload.metaCapiToken = capiTokenInput.trim();
      }

      const res = await fetch(`/api/tenants/${tenantSlug}/pixel-config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPixelConfig(data.config);
        toast.success(data.message || "পিক্সেল কনফিগারেশন সংরক্ষিত হয়েছে!");
        setCapiTokenInput("");
        setPixelModalOpen(false);
      } else {
        toast.error(data.error || "সংরক্ষণ করতে সমস্যা হয়েছে");
      }
    } catch (err: any) {
      console.error("Save pixel error:", err);
      toast.error("সার্ভার ত্রুটি, আবার চেষ্টা করুন");
    } finally {
      setIsSavingPixel(false);
    }
  };

  const handleSendTestEvent = async () => {
    setIsSendingTestEvent(true);
    setTestEventFeedback(null);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/pixel-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metaPixelId: pixelIdInput || pixelConfig.metaPixelId,
          metaCapiToken: capiTokenInput || undefined,
          metaTestEventCode: testEventCodeInput || pixelConfig.metaTestEventCode,
          amount: 1500,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestEventFeedback({
          success: true,
          message: data.message || "মেটা সার্ভারে টেস্ট ইভেন্ট সফলভাবে পাঠানো হয়েছে!",
          eventsReceived: data.eventsReceived,
          fbtraceId: data.fbtraceId,
        });
        toast.success("মেটা টেস্ট ইভেন্ট সফল হয়েছে!");
      } else {
        setTestEventFeedback({
          success: false,
          message: data.error || "মেটা ইভেন্ট গ্রহণে অস্বীকৃতি জানিয়েছে",
        });
        toast.error(data.error || "টেস্ট ইভেন্ট ব্যর্থ হয়েছে");
      }
    } catch (err: any) {
      console.error("Test event error:", err);
      setTestEventFeedback({
        success: false,
        message: "সার্ভারের সাথে যোগাযোগ বিচ্ছিন্ন হয়েছে",
      });
      toast.error("সার্ভার ত্রুটি");
    } finally {
      setIsSendingTestEvent(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Add Spend & Pixel Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Flame className="h-6 w-6 text-amber-500" />
            AdsFlow (Meta Ad ROI Tracking & ROAS)
          </h1>
          <p className="text-xs text-slate-400">
            ফেসবুক ও ইনস্টাগ্রাম বিজ্ঞাপন খরচ, মেসেঞ্জার সেলস এবং রিয়েল-টাইম ROAS ট্র্যাক করুন।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setTestEventFeedback(null);
              setPixelModalOpen(true);
            }}
            variant="outline"
            className="text-xs font-bold py-2.5 px-3 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer gap-1.5"
          >
            <Zap className={`h-4 w-4 ${pixelConfig.isConfigured ? "text-emerald-500" : "text-amber-500"}`} />
            <span>মেটা পিক্সেল ও CAPI</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                pixelConfig.isConfigured
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50"
                  : "bg-amber-50 text-amber-600 dark:bg-amber-950/50"
              }`}
            >
              {pixelConfig.isConfigured ? "সক্রিয়" : "সেটআপ"}
            </span>
          </Button>

          <Button
            onClick={() => setLogSpendOpen(true)}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm cursor-pointer gap-1.5"
          >
            <Plus className="h-4 w-4" /> বিজ্ঞাপন খরচ যুক্ত করুন
          </Button>
        </div>
      </div>

      {/* Meta Pixel & Conversions API (CAPI) Status Card */}
      <div className="rounded-2xl border border-border bg-gradient-to-r from-blue-50/40 via-indigo-50/20 to-purple-50/30 dark:from-slate-950 dark:to-slate-900 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-blue-600/10 text-blue-600 rounded-xl">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  মেটা পিক্সেল ও সার্ভার-সাইড কনভার্সন এপিআই (Meta Pixel & CAPI)
                </h3>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 ${
                    pixelConfig.isConfigured
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${pixelConfig.isConfigured ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                  {pixelConfig.isConfigured ? "লাইভ ট্র্যাকিং সক্রিয়" : "সেটআপ প্রয়োজন"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                মেসেঞ্জার বা শপ থেকে কোনো গ্রাহক অর্ডার সম্পন্ন করলেই সরাসরি ফেসবুক সার্ভারে Purchase কনভার্সন ইভেন্ট চলে যাবে। এর ফলে iOS 14 / অ্যাডব্লকার কোনো সমস্যা করবে না এবং আপনার বিজ্ঞাপনের ROAS নির্ভুলভাবে অপ্টিমাইজ হবে।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSendTestEvent()}
              disabled={isSendingTestEvent || !pixelConfig.metaPixelId}
              className="text-xs font-semibold rounded-xl cursor-pointer gap-1.5"
            >
              {isSendingTestEvent ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> টেস্ট হচ্ছে...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 text-blue-600" /> টেস্ট ইভেন্ট পাঠান
                </>
              )}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setTestEventFeedback(null);
                setPixelModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer gap-1.5"
            >
              <Settings2 className="h-3.5 w-3.5" /> কনফিগার করুন
            </Button>
          </div>
        </div>

        {/* Configuration Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border/60 text-xs">
          <div>
            <span className="text-[11px] text-slate-400 block">Pixel ID:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {pixelConfig.metaPixelId || "যুক্ত নেই"}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">CAPI Token:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {pixelConfig.hasCapiToken ? pixelConfig.metaCapiTokenMasked || "••••••••" : "যুক্ত নেই"}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Ad Account ID:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {pixelConfig.metaAdAccountId || "—"}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Test Event Code:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {pixelConfig.metaTestEventCode || "—"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Top Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Attributed Sales */}
        <div className="rounded-2xl border border-border bg-white p-5 shadow-xs dark:bg-slate-950">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Attributed Ad Revenue
          </span>
          <div className="text-2xl font-black text-indigo-600 mt-2 font-mono">
            {formatCurrencyBdt(totalAttributedRevenue)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <Facebook className="h-3 w-3 text-blue-600" />
            <span>{orderCount} টি কনভার্ট হওয়া অর্ডার</span>
          </div>
        </div>

        {/* Card 2: Total Ad Spend */}
        <div className="rounded-2xl border border-border bg-white p-5 shadow-xs dark:bg-slate-950">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Meta Ad Spend
            </span>
            <span className="text-[10px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
              {spends.length} টি এন্ট্রি
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono">
            {formatCurrencyBdt(totalAdSpend)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {totalAdSpend > 0 ? "ট্র্যাক করা বিজ্ঞাপন ব্যয়" : "স্পেন্ড যুক্ত করতে বাটনে চাপুন"}
          </span>
        </div>

        {/* Card 3: Blended ROAS */}
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-5 shadow-xs dark:bg-slate-950 dark:border-indigo-900">
          <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">
            Blended ROAS (Return on Ad Spend)
          </span>
          <div className="text-2xl font-black text-indigo-700 dark:text-indigo-400 mt-2 font-mono">
            {totalAdSpend > 0 ? `${blendedRoas.toFixed(2)}x` : "0.00x"}
          </div>
          <span className="text-[11px] font-semibold mt-1 block">
            {totalAdSpend === 0 ? (
              <span className="text-slate-400">খরচ যোগ করার পর ROAS দেখা যাবে</span>
            ) : blendedRoas >= 3.5 ? (
              <span className="text-emerald-600 font-bold inline-flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> চমৎকার লাভজনক (High ROI)
              </span>
            ) : blendedRoas >= 2.0 ? (
              <span className="text-indigo-600 font-bold inline-flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> লাভজনক (Profitable)
              </span>
            ) : (
              <span className="text-rose-500 font-bold inline-flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> অপ্টিমাইজেশন প্রয়োজন
              </span>
            )}
          </span>
        </div>

        {/* Card 4: Cost Per Purchase (CPP) */}
        <div className="rounded-2xl border border-border bg-white p-5 shadow-xs dark:bg-slate-950">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Cost Per Order (CPP / CPA)
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono">
            {cpp > 0 ? formatCurrencyBdt(cpp) : "৳0"}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            প্রতিটি অর্ডার আনতে বিজ্ঞাপন খরচ
          </span>
        </div>
      </div>

      {/* 3. Interactive Target ROAS Simulator */}
      <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/50 to-orange-50/30 dark:from-slate-950 dark:to-slate-900 p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="h-5 w-5 text-amber-600" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            টার্গেট ROAS ও প্রফিট সিমুলেটর (ROAS Simulator)
          </h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
          আপনার দৈনিক ফেসবুক বিজ্ঞাপন বাজেট ও টার্গেট ROAS নির্ধারণ করে সম্ভাব্য বিক্রি ও লাভের অনুপাত দেখুন:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              দৈনিক অ্যাড বাজেট (BDT): ৳{simBudget}
            </label>
            <input
              type="range"
              min="500"
              max="20000"
              step="500"
              value={simBudget}
              onChange={(e) => setSimBudget(Number(e.target.value))}
              className="w-full cursor-pointer accent-amber-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              টার্গেট ROAS: {simRoas.toFixed(1)}x
            </label>
            <input
              type="range"
              min="1.5"
              max="8.0"
              step="0.5"
              value={simRoas}
              onChange={(e) => setSimRoas(Number(e.target.value))}
              className="w-full cursor-pointer accent-amber-500"
            />
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200/60 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">প্রত্যাশিত বিক্রয়:</span>
              <span className="font-bold text-emerald-600 font-mono">
                {formatCurrencyBdt(simBudget * simRoas)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">বিজ্ঞাপন খরচ বাদ দিয়ে নিট:</span>
              <span className="font-bold text-indigo-600 font-mono">
                {formatCurrencyBdt(simBudget * simRoas - simBudget)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Two Columns: Ad Spend Log & Attributed Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Recorded Ad Spend History */}
        <div className="rounded-2xl border border-border bg-white shadow-xs dark:bg-slate-950 overflow-hidden text-xs">
          <div className="p-4 border-b border-border font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              রেকর্ড করা বিজ্ঞাপন খরচ ({spends.length})
            </span>
            <button
              onClick={() => setLogSpendOpen(true)}
              className="text-xs text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> খরচ যোগ করুন
            </button>
          </div>

          {spends.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-xs space-y-2">
              <Flame className="w-8 h-8 mx-auto text-slate-300" />
              <p>এখনো কোনো বিজ্ঞাপন খরচ রেকর্ড করা হয়নি।</p>
              <Button
                size="sm"
                onClick={() => setLogSpendOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white text-xs rounded-xl"
              >
                + আজকের স্পেন্ড যোগ করুন
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border max-h-80 overflow-y-auto">
              {spends.map((s) => (
                <div key={s.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white font-mono">
                        {formatCurrencyBdt(s.amount)}
                      </span>
                      <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-1.5 py-0.5 rounded">
                        {s.platform}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      {s.campaignName || "General Boost"} • {new Date(s.date).toLocaleDateString("bn-BD")}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteSpend(s.id)}
                    className="text-slate-300 hover:text-rose-500 p-1 transition-colors"
                    title="মুছুন"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Attributed Facebook / Instagram Orders */}
        <div className="rounded-2xl border border-border bg-white shadow-xs dark:bg-slate-950 overflow-hidden text-xs">
          <div className="p-4 border-b border-border font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Facebook className="w-4 h-4 text-blue-600" />
              বিজ্ঞাপন থেকে আসা অর্ডারসমূহ ({orders.length})
            </span>
            <span className="text-emerald-600 font-bold text-[11px] font-mono">
              মোট: {formatCurrencyBdt(totalAttributedRevenue)}
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-xs space-y-1">
              <Target className="w-8 h-8 mx-auto text-slate-300 mb-1" />
              <p>ফেসবুক/ইনস্টাগ্রাম মেসেঞ্জার থেকে কোনো অর্ডার পাওয়া যায়নি।</p>
              <p className="text-[10px] text-slate-400">
                ইনবক্সে কাস্টমার অর্ডার দিলে তা স্বয়ংক্রিয়ভাবে এখানে গণনা হবে।
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border max-h-80 overflow-y-auto">
              {orders.map((ord) => (
                <div key={ord.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white font-mono">{ord.orderNumber}</span>
                      <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">
                        {ord.channel}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      {ord.customerName} {ord.customerPhone ? `(${ord.customerPhone})` : ""}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-slate-900 dark:text-white block font-mono">
                      {formatCurrencyBdt(ord.totalAmount)}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold">{ord.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Log Ad Spend Modal */}
      <Dialog open={logSpendOpen} onOpenChange={setLogSpendOpen}>
        <DialogClose onClose={() => setLogSpendOpen(false)} />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-amber-500" />
            দৈনিক মেটা বিজ্ঞাপন খরচ যুক্ত করুন (Log Ad Spend)
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleLogSpend} className="space-y-3.5 py-2 text-xs">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              বিজ্ঞাপন খরচের পরিমাণ (BDT) *
            </label>
            <Input
              type="number"
              value={spendAmount}
              onChange={(e) => setSpendAmount(e.target.value)}
              placeholder="উদা: 1500"
              required
              className="text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              তারিখ *
            </label>
            <Input
              type="date"
              value={spendDate}
              onChange={(e) => setSpendDate(e.target.value)}
              required
              className="text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              ক্যাম্পেইনের নাম বা ট্যাগ
            </label>
            <Input
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="উদা: Watch Messenger Ad / Eid Campaign"
              className="text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              প্ল্যাটফর্ম
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setPlatform("FACEBOOK")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                  platform === "FACEBOOK"
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40"
                    : "border-border text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Facebook className="h-4 w-4" /> Facebook Ads
              </button>
              <button
                type="button"
                onClick={() => setPlatform("INSTAGRAM")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                  platform === "INSTAGRAM"
                    ? "border-pink-500 bg-pink-50 text-pink-700 dark:bg-pink-950/40"
                    : "border-border text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Instagram className="h-4 w-4" /> Instagram Ads
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-2.5 rounded-xl shadow-md mt-2 cursor-pointer text-xs"
          >
            {isSubmitting ? "সংরক্ষণ হচ্ছে..." : "বিজ্ঞাপন খরচ সেভ করুন"}
          </Button>
        </form>
      </Dialog>

      {/* Meta Pixel & Conversions API Settings Modal */}
      <Dialog open={pixelModalOpen} onOpenChange={setPixelModalOpen}>
        <DialogClose onClose={() => setPixelModalOpen(false)} />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            মেটা পিক্সেল ও কনভার্সন এপিআই (Meta Pixel & CAPI Settings)
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSavePixelConfig} className="space-y-4 py-2 text-xs">
          <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/60 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-blue-800 dark:text-blue-300">
              <ShieldCheck className="h-4 w-4" />
              সার্ভার-সাইড ট্র্যাকিং কেন প্রয়োজন?
            </div>
            <p className="text-[11px] text-blue-700/80 dark:text-blue-400 leading-relaxed">
              কনভার্সন এপিআই (CAPI) এর মাধ্যমে ফেসবুক মেসেঞ্জার বা স্টোর থেকে যেকোনো পারচেজ সরাসরি মেটা সার্ভারে রেকর্ড হয়। এটি ব্রাউজার অ্যাড-ব্লকার ও iOS 14 পলিসির বাইরে গিয়ে ১০০% সেলস ডাটা ক্যাপচার করে বিজ্ঞাপনের ROAS বাড়ায়।
            </p>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Meta Pixel ID *
            </label>
            <Input
              type="text"
              value={pixelIdInput}
              onChange={(e) => setPixelIdInput(e.target.value)}
              placeholder="উদা: 876543210987654"
              required
              className="text-xs font-mono"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Meta Events Manager থেকে আপনার পিক্সেল আইডি সংগ্রহ করুন।
            </span>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Conversions API Access Token (CAPI Token) *
            </label>
            <Input
              type="password"
              value={capiTokenInput}
              onChange={(e) => setCapiTokenInput(e.target.value)}
              placeholder={pixelConfig.hasCapiToken ? pixelConfig.metaCapiTokenMasked : "EAAG... (সিস্টেম ইউজার টোকেন পেস্ট করুন)"}
              className="text-xs font-mono"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Meta Business Manager &gt; Events Manager &gt; Settings &gt; Generate Access Token.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Test Event Code (ঐচ্ছিক)
              </label>
              <Input
                type="text"
                value={testEventCodeInput}
                onChange={(e) => setTestEventCodeInput(e.target.value)}
                placeholder="উদা: TEST12345"
                className="text-xs font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Meta Test events ট্যাবে লাইভ দেখতে এই কোড দিন।
              </span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Meta Ad Account ID (ঐচ্ছিক)
              </label>
              <Input
                type="text"
                value={adAccountIdInput}
                onChange={(e) => setAdAccountIdInput(e.target.value)}
                placeholder="উদা: act_123456789"
                className="text-xs font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                বিজ্ঞাপন একাউন্ট রেফারেন্স।
              </span>
            </div>
          </div>

          {/* Test Event Feedback Area */}
          {testEventFeedback && (
            <div
              className={`p-3 rounded-xl border text-xs ${
                testEventFeedback.success
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                  : "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                {testEventFeedback.success ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                )}
                {testEventFeedback.message}
              </div>
              {testEventFeedback.fbtraceId && (
                <div className="mt-1 font-mono text-[10px] text-slate-500">
                  Trace ID: {testEventFeedback.fbtraceId} | ইভেন্ট গৃহীত: {testEventFeedback.eventsReceived}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSendingTestEvent || (!pixelIdInput && !pixelConfig.metaPixelId)}
              onClick={handleSendTestEvent}
              className="w-1/2 text-xs font-semibold rounded-xl cursor-pointer gap-1"
            >
              {isSendingTestEvent ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> পাঠানো হচ্ছে...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 text-blue-600" /> টেস্ট ইভেন্ট চেক করুন
                </>
              )}
            </Button>

            <Button
              type="submit"
              disabled={isSavingPixel}
              className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-md cursor-pointer text-xs"
            >
              {isSavingPixel ? "সংরক্ষণ হচ্ছে..." : "কনফিগারেশন সেভ করুন"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
