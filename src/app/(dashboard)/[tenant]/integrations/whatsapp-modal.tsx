"use client";

import * as React from "react";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Smartphone,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Sparkles,
  Lock,
  Headphones,
  ShoppingBag,
  Zap,
} from "lucide-react";

interface WhatsAppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantSlug: string;
  metaAppId: string;
  metaConfigId: string;
  isConnected: boolean;
  connectedChannel?: {
    id: string;
    pageName?: string | null;
    pageId?: string | null;
  } | null;
  onCompleteConnection: (payload: {
    phoneNumberId: string;
    wabaId?: string;
    phoneNumber?: string;
    code?: string;
  }) => Promise<void>;
  onDisconnect?: (channelId: string, name: string) => Promise<void>;
}

export function WhatsAppModal({
  open,
  onOpenChange,
  tenantSlug,
  metaAppId,
  metaConfigId,
  isConnected,
  connectedChannel,
  onCompleteConnection,
  onDisconnect,
}: WhatsAppModalProps) {
  const [connecting, setConnecting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Preload Meta JavaScript SDK for unblocked, instant popup
  React.useEffect(() => {
    if (typeof window !== "undefined" && metaAppId) {
      const fbWin = window as any;
      if (!fbWin.FB && !document.getElementById("facebook-jssdk")) {
        const script = document.createElement("script");
        script.id = "facebook-jssdk";
        script.src = "https://connect.facebook.net/en_US/sdk.js";
        script.async = true;
        script.defer = true;
        script.onload = () => {
          try {
            if (fbWin.FB) {
              fbWin.FB.init({
                appId: metaAppId,
                autoLogAppEvents: true,
                xfbml: true,
                version: "v19.0",
              });
            }
          } catch (e) {
            console.warn("FB.init onload error:", e);
          }
        };
        document.body.appendChild(script);
      } else if (fbWin.FB) {
        try {
          fbWin.FB.init({
            appId: metaAppId,
            autoLogAppEvents: true,
            xfbml: true,
            version: "v19.0",
          });
        } catch (e) {
          console.warn("FB.init ready error:", e);
        }
      }
    }
  }, [metaAppId]);

  const launchEmbeddedSignup = () => {
    if (!metaAppId || !metaConfigId) {
      setError(
        "সুপার অ্যাডমিন প্যানেলে Meta App ID বা Configuration ID কনফিগারেশন অনুপস্থিত। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।"
      );
      return;
    }

    setConnecting(true);
    setError(null);

    const fbWindow = window as any;

    const doLogin = () => {
      try {
        fbWindow.FB.init({
          appId: metaAppId,
          autoLogAppEvents: true,
          xfbml: true,
          version: "v19.0",
        });
      } catch (e) {
        console.warn("FB.init error before login:", e);
      }

      // Safety timeout (45s)
      const safetyTimer = setTimeout(() => {
        setConnecting(false);
        setError(
          "মেটা পপ-আপ সময়মতো রেসপন্স করেনি। আপনার ব্রাউজারের পপ-আপ পারমিশন পরীক্ষা করুন।"
        );
      }, 45000);

      const messageHandler = async (event: MessageEvent) => {
        if (
          event.origin !== "https://www.facebook.com" &&
          event.origin !== "https://web.facebook.com"
        ) {
          return;
        }

        try {
          const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
          if (data.type === "WA_EMBEDDED_SIGNUP") {
            clearTimeout(safetyTimer);
            window.removeEventListener("message", messageHandler);

            if (data.event === "FINISH") {
              const { phone_number_id, waba_id } = data.data || {};
              if (phone_number_id) {
                await onCompleteConnection({
                  phoneNumberId: phone_number_id,
                  wabaId: waba_id,
                });
              }
            } else if (data.event === "CANCEL") {
              setConnecting(false);
              setError("মেটা সাইনআপ বাতিল করা হয়েছে।");
            } else if (data.event === "ERROR") {
              setConnecting(false);
              setError(data.data?.error_message || "মেটা সাইনআপে সমস্যা হয়েছে।");
            }
          }
        } catch (e) {
          // ignore non-json messages
        }
      };

      window.addEventListener("message", messageHandler);

      try {
        fbWindow.FB.login(
          function (response: any) {
            clearTimeout(safetyTimer);
            if (response.authResponse?.code) {
              console.log("[WA EMBEDDED] Received authorization code:", response.authResponse.code);
            } else if (
              response.status === "not_authorized" ||
              response.status === "unknown" ||
              !response.authResponse
            ) {
              setConnecting(false);
            }
          },
          {
            config_id: metaConfigId,
            response_type: "code",
            override_default_response_type: true,
            extras: {
              setup: {},
              featureType: "whatsapp_business_app_onboarding",
              sessionInfoVersion: "2",
            },
          }
        );
      } catch (loginErr: any) {
        clearTimeout(safetyTimer);
        window.removeEventListener("message", messageHandler);
        setConnecting(false);
        setError("পপআপ চালু হতে সমস্যা হয়েছে: " + (loginErr?.message || "ব্রাউজার পপআপ পারমিশন চেক করুন।"));
      }
    };

    if (!fbWindow.FB) {
      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.defer = true;
      script.onload = doLogin;
      script.onerror = () => {
        setConnecting(false);
        setError("Facebook SDK লোড করা সম্ভব হয়নি। আপনার ইন্টারনেট কানেকশন বা অ্যাড-ব্লকার চেক করুন।");
      };
      document.body.appendChild(script);
    } else {
      doLogin();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-2xl p-0 overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl"
    >
      <DialogClose onClose={() => onOpenChange(false)} />

      {/* Hero Ambient Header with official WhatsApp Green & Meta Blue gradients */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-950 to-slate-900 p-6 sm:p-7 text-white border-b border-emerald-900/30">
        {/* Dynamic Background Glow Rings */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Badges */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold tracking-wide">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Official Meta WhatsApp Cloud API</span>
          </div>

          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300 text-[10px] font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Ban-Safe Official Tech</span>
          </div>
        </div>

        {/* Header Title with Official WhatsApp Vector Icon */}
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 shrink-0">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.075-2.072-.497-1.764-.733-2.888-2.528-2.975-2.645-.088-.116-.719-.956-.719-1.822 0-.866.452-1.292.613-1.468.161-.176.353-.221.47-.221.118 0 .235.002.338.007.108.005.253-.041.396.302.147.353.501 1.222.545 1.311.044.089.074.192.015.309-.059.117-.088.19-.176.294-.088.103-.185.23-.264.309-.089.088-.181.185-.078.362.103.176.458.756.983 1.224.675.602 1.244.788 1.42.876.176.088.279.074.382-.045.103-.117.441-.513.559-.689.118-.176.235-.147.397-.088.162.059 1.03.486 1.206.574.177.089.294.133.338.207.044.074.044.428-.1 1.026z" />
              <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.98-1.306A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.167a8.125 8.125 0 01-4.218-1.177l-.302-.18-2.96.776.79-2.885-.197-.314A8.132 8.132 0 013.833 12c0-4.503 3.664-8.167 8.167-8.167 4.503 0 8.167 3.664 8.167 8.167 0 4.503-3.664 8.167-8.167 8.167z" />
            </svg>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              WhatsApp Business AI Integration
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
              মেটার অফিশিয়াল এমবেডেড সাইনআপের মাধ্যমে আপনার বিজনেস নম্বরটি যুক্ত করুন। আপনার বিদ্যমান হোয়াটসঅ্যাপ বিজনেস অ্যাপ অক্ষত রেখেই এআই কাস্টমারদের সাথে স্বয়ংক্রিয় অর্ডার প্রসেসিং শুরু করবে।
            </p>
          </div>
        </div>
      </div>

      {/* Modal Body Container */}
      <div className="p-6 sm:p-7 space-y-6">
        
        {/* Connected Channel Active State Banner (If Connected) */}
        {isConnected && connectedChannel && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {connectedChannel.pageName || "WhatsApp Business Account"}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold tracking-wide">
                    Live Active
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                  ID: {connectedChannel.pageId || connectedChannel.id}
                </span>
              </div>
            </div>

            {onDisconnect && (
              <button
                type="button"
                onClick={() => onDisconnect(connectedChannel.id, connectedChannel.pageName || "WhatsApp")}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer"
              >
                ডিসকানেক্ট
              </button>
            )}
          </div>
        )}

        {/* Master Interactive Animated Cloud Bridge Pipeline (SVG Architecture) */}
        <div className="relative rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-gradient-to-b from-slate-50 to-slate-100/60 dark:from-slate-900/80 dark:to-slate-950 p-4 sm:p-5 overflow-hidden">
          
          {/* Subtle Ambient Background Watermark */}
          <div className="absolute right-3 top-3 opacity-5 pointer-events-none">
            <svg className="w-32 h-32 fill-current text-slate-900 dark:text-white" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.98-1.306A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
            </svg>
          </div>

          {/* SVG Animated Flow Diagram */}
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              
              {/* Node 1: Merchant's Smartphone */}
              <div className="flex flex-col items-center text-center space-y-2 w-28 shrink-0">
                <div className="relative group">
                  <div className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-800 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-600 shadow-md transition-transform group-hover:scale-105">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                    মোবাইল ফোন
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block mt-0.5">
                    অ্যাপ ও চ্যাট অক্ষত
                  </span>
                </div>
              </div>

              {/* Animated Vector Pipe 1 */}
              <div className="flex-1 mx-2 relative flex flex-col items-center">
                <svg className="w-full h-8" viewBox="0 0 140 24" fill="none" preserveAspectRatio="none">
                  {/* Background Track */}
                  <line x1="0" y1="12" x2="140" y2="12" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" className="dark:stroke-slate-700" />
                  {/* Animated Active Pulse Line */}
                  <line x1="0" y1="12" x2="140" y2="12" stroke="#10b981" strokeWidth="2.5" strokeDasharray="8 8">
                    <animate attributeName="stroke-dashoffset" from="0" to="-32" dur="1.2s" repeatCount="indefinite" />
                  </line>
                  {/* Glowing Floating Signal Packet */}
                  <circle r="3.5" fill="#10b981">
                    <animate attributeName="cx" values="10;130" dur="1.6s" repeatCount="indefinite" />
                    <animate attributeName="cy" values="12;12" dur="1.6s" repeatCount="indefinite" />
                  </circle>
                </svg>
                <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 tracking-wider uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Bi-Directional Bridge
                </span>
              </div>

              {/* Node 2: Mogent AI Brain */}
              <div className="flex flex-col items-center text-center space-y-2 w-28 shrink-0">
                <div className="relative group">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-500/50 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-105">
                    <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
                  </div>
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                    মোগেন্ট এআই
                  </span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold block mt-0.5">
                    ২৪/৭ সেলস অটোমেশন
                  </span>
                </div>
              </div>

              {/* Animated Vector Pipe 2 */}
              <div className="flex-1 mx-2 relative flex flex-col items-center">
                <svg className="w-full h-8" viewBox="0 0 140 24" fill="none" preserveAspectRatio="none">
                  {/* Background Track */}
                  <line x1="0" y1="12" x2="140" y2="12" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" className="dark:stroke-slate-700" />
                  {/* Animated Active Pulse Line */}
                  <line x1="0" y1="12" x2="140" y2="12" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="8 8">
                    <animate attributeName="stroke-dashoffset" from="0" to="-32" dur="1.2s" repeatCount="indefinite" />
                  </line>
                  {/* Glowing Floating Signal Packet */}
                  <circle r="3.5" fill="#3b82f6">
                    <animate attributeName="cx" values="10;130" dur="1.6s" repeatCount="indefinite" />
                    <animate attributeName="cy" values="12;12" dur="1.6s" repeatCount="indefinite" />
                  </circle>
                </svg>
                <span className="text-[9px] font-bold text-blue-700 dark:text-blue-400 tracking-wider uppercase bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                  Meta Verified Cloud
                </span>
              </div>

              {/* Node 3: Meta Official Cloud Servers */}
              <div className="flex flex-col items-center text-center space-y-2 w-28 shrink-0">
                <div className="relative group">
                  <div className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-800 border-2 border-blue-500/40 flex items-center justify-center text-blue-600 shadow-md transition-transform group-hover:scale-105">
                    <ShieldCheck className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                    মেটা সার্ভার
                  </span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold block mt-0.5">
                    ১০০% অফিশিয়াল
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* 3-Step Clean Visual Progress Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 relative group hover:border-emerald-500/40 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
                ধাপ ০১
              </span>
              <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-[10px] font-bold">
                1
              </div>
            </div>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
              মেটা ফেসবুক লগইন
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed block mt-1">
              মেটার নিরাপদ অফিসিয়াল পপআপে আপনার ফেসবুক আইডিতে সাইন-ইন
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 relative group hover:border-emerald-500/40 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
                ধাপ ০২
              </span>
              <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-[10px] font-bold">
                2
              </div>
            </div>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
              হোয়াটসঅ্যাপ নম্বর নির্বাচন
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed block mt-1">
              বিদ্যমান বিজনেস নম্বর বা নতুন নম্বর সিলেক্ট করে ওটিপি ভেরিফাই
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 relative group hover:border-emerald-500/40 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
                ধাপ ০৩
              </span>
              <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-[10px] font-bold">
                3
              </div>
            </div>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
              ইনস্ট্যান্ট এআই লাইভ
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed block mt-1">
              ১ সেকেন্ডে ক্লাউড কানেক্ট হয়ে গ্রাহকদের সাথে সেলস চ্যাট শুরু
            </span>
          </div>
        </div>

        {/* Error Notice Display */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-start gap-3 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-200 animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <div className="space-y-1">
              <span className="font-extrabold block text-sm">সংযোগ প্রক্রিয়ায় সমস্যা হয়েছে</span>
              <span className="text-[11px] leading-relaxed block text-rose-700 dark:text-rose-300">{error}</span>
            </div>
          </div>
        )}

        {/* Primary High-Impact CTA Button */}
        <div className="space-y-3 pt-1">
          <Button
            type="button"
            onClick={launchEmbeddedSignup}
            disabled={connecting}
            className="w-full h-14 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-sm sm:text-base font-extrabold shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-3 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-75"
          >
            {connecting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>মেটা সিকিউর পপআপ লোড হচ্ছে...</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.075-2.072-.497-1.764-.733-2.888-2.528-2.975-2.645-.088-.116-.719-.956-.719-1.822 0-.866.452-1.292.613-1.468.161-.176.353-.221.47-.221.118 0 .235.002.338.007.108.005.253-.041.396.302.147.353.501 1.222.545 1.311.044.089.074.192.015.309-.059.117-.088.19-.176.294-.088.103-.185.23-.264.309-.089.088-.181.185-.078.362.103.176.458.756.983 1.224.675.602 1.244.788 1.42.876.176.088.279.074.382-.045.103-.117.441-.513.559-.689.118-.176.235-.147.397-.088.162.059 1.03.486 1.206.574.177.089.294.133.338.207.044.074.044.428-.1 1.026z" />
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.98-1.306A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.167a8.125 8.125 0 01-4.218-1.177l-.302-.18-2.96.776.79-2.885-.197-.314A8.132 8.132 0 013.833 12c0-4.503 3.664-8.167 8.167-8.167 4.503 0 8.167 3.664 8.167 8.167 0 4.503-3.664 8.167-8.167 8.167z" />
                </svg>
                <span>১-ক্লিকে মেটা হোয়াটসঅ্যাপ কানেক্ট করুন</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>

          <p className="text-xs text-slate-500 dark:text-slate-400 text-center font-medium">
            সম্পূর্ণ স্বয়ংক্রিয় ক্লাউড অনবোর্ডিং — কোনো এপিআই টোকেন বা আইডি ম্যানুয়ালি দেওয়ার প্রয়োজন নেই
          </p>
        </div>

        {/* 4 Feature Trust Guarantees Grid (Zero Emojis) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                মোবাইল অ্যাপ সচল থাকবে
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed block mt-0.5">
                আপনার বর্তমান হোয়াটসঅ্যাপ বিজনেস অ্যাপ চালু থাকবে, কোনো চ্যাট বা মিডিয়া ডিলিট হবে না।
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <ExternalLink className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                Click-to-WhatsApp Ads রেডি
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed block mt-0.5">
                ফেসবুক ও ইনস্টাগ্রাম বিজ্ঞাপনের ট্রাফিক স্বয়ংক্রিয়ভাবে হ্যান্ডেল করে কাস্টমারকে অর্ডারে কনভার্ট করবে।
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                ১০০% অফিশিয়াল ও ব্যান-নিরাপদ
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed block mt-0.5">
                মেটার অফিশিয়াল ক্লাউড এপিআই ইনফ্রাস্ট্রাকচার। কোনো থার্ড-পার্টি আনঅথরাইজড টুল নয়।
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                ২৪/৭ স্বয়ংক্রিয় সেলস ও ট্র্যাকিং
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed block mt-0.5">
                ক্যাশ অন ডেলিভারি অর্ডার কনফার্মেশন, সাইজ গাইড ও পার্সেল ডেলিভারি স্ট্যাটাস ট্র্যাকিং সরাসরি চ্যাটে।
              </span>
            </div>
          </div>

        </div>

      </div>
    </Dialog>
  );
}
