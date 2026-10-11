"use client";

import React, { useState } from "react";
import {
  Key,
  Bot,
  Shield,
  Save,
  CheckCircle2,
  Loader2,
  Sparkles,
  PhoneCall,
  MessageSquare,
  Globe,
  CreditCard,
  Send,
  Cloud,
  Eye,
  EyeOff,
  Copy,
  Check,
  Server,
  Lock,
  Radio,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface MasterConfigData {
  // AI Brain
  defaultAiModel?: string;
  openaiApiKey?: string;
  geminiApiKey?: string;
  anthropicApiKey?: string;
  perMessageCost?: number;

  // Voice & Telephony
  voiceProvider?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  sipServer?: string;
  sipPort?: number;
  sipUsername?: string;
  sipPassword?: string;
  sipCallerId?: string;
  ttsProvider?: string;
  ttsApiKey?: string;
  ttsVoiceId?: string;
  perMinuteCallCost?: number;

  // SMS
  smsProvider?: string;
  greenwebToken?: string;
  bulksmsApiKey?: string;
  bulksmsSenderId?: string;
  sslczSmsApiKey?: string;
  sslczSmsSid?: string;
  perSmsCost?: number;

  // Payment
  bkashAppKey?: string;
  bkashAppSecret?: string;
  bkashUsername?: string;
  bkashPassword?: string;
  bkashSandbox?: boolean;
  sslczStoreId?: string;
  sslczStorePassword?: string;
  sslczSandbox?: boolean;
  aamarpayStoreId?: string;
  aamarpaySignatureKey?: string;
  aamarpaySandbox?: boolean;

  // Storage
  storageProvider?: string;
  storageAccessKeyId?: string;
  storageSecretAccessKey?: string;
  storageBucketName?: string;
  storageRegion?: string;
  storageEndpoint?: string;
  storagePublicUrl?: string;

  // Google
  googleClientId?: string;
  googleClientSecret?: string;
  googleSheetsApiKey?: string;
  googleServiceAccountJson?: string;

  // Meta & WhatsApp
  metaAppId?: string;
  metaAppSecret?: string;
  metaConfigId?: string;
  whatsappSystemToken?: string;
  whatsappVerifyToken?: string;
}

export function ApiSettingsClient({
  initialConfig,
  serverOutboundIp = "127.0.0.1",
}: {
  initialConfig: MasterConfigData;
  serverOutboundIp?: string;
}) {
  const [activeTab, setActiveTab] = useState<
    "ai" | "voice" | "meta" | "google" | "payment" | "sms" | "storage"
  >("ai");

  // Form State
  const [config, setConfig] = useState<MasterConfigData>(initialConfig);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [copiedIp, setCopiedIp] = useState(false);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleSecret = (field: string) => {
    setShowSecret((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const updateField = (field: keyof MasterConfigData, val: any) => {
    setConfig((prev) => ({ ...prev, [field]: val }));
  };

  const copyIp = () => {
    navigator.clipboard.writeText(serverOutboundIp);
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "কনফিগারেশন সেভ করতে সমস্যা হয়েছে।");
      }

      setSuccessMsg("সুপার অ্যাডমিন সেন্ট্রাল কনফিগারেশন সফলভাবে AES-256 এনক্রিপ্ট ও সেভ হয়েছে!");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "সার্ভারে সমস্যা হয়েছে।");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "ai", label: "AI Engine", icon: Bot },
    { id: "voice", label: "Voice / SIP", icon: PhoneCall },
    { id: "meta", label: "Meta & WhatsApp", icon: MessageSquare },
    { id: "google", label: "Google OAuth & Sheets", icon: Globe },
    { id: "payment", label: "Payment Gateways", icon: CreditCard },
    { id: "sms", label: "SMS Gateways", icon: Send },
    { id: "storage", label: "Cloud Storage", icon: Cloud },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Key className="h-6 w-6 text-amber-400" />
            Master API Hub & Central Infrastructure
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            সুপার অ্যাডমিন কেন্দ্রীয় কনফিগারেশন — এখান থেকে সমস্ত এআই, ভয়েস টেলিফোনি, পেমেন্ট ও মেসেজিং চ্যানেল পরিচালিত হয়।
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>AES-256-GCM Encrypted at Rest</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-800 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Notification Banners */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center gap-2.5 text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl flex items-center gap-2.5 text-xs">
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form
        onSubmit={handleSave}
        className="rounded-3xl border border-slate-800 bg-slate-950 p-7 space-y-6 text-xs shadow-2xl"
      >
        {/* ================= TAB 1: AI BRAIN ================= */}
        {activeTab === "ai" && (
          <div className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-amber-400" />
                Central AI Brain & Margin Controls
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                সেন্ট্রাল এআই মডেল এবং প্রতি মেসেজে মার্চেন্টদের ওয়ালেট থেকে চার্জ নির্ধারণ করুন।
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-300 uppercase text-[10px] tracking-wider block mb-1">
                Default AI Model (সেন্ট্রাল এআই মডেল নির্বাচন)
              </label>
              <select
                value={config.defaultAiModel === "gemini-1.5-flash" ? "gemini-3.5-flash-lite" : (config.defaultAiModel || "gemini-3.5-flash-lite")}
                onChange={(e) => updateField("defaultAiModel", e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs text-white"
              >
                <option value="gemini-3.5-flash-lite">Google Gemini 3.5 Flash Lite (Ultra Fast & Lowest Cost - Recommended)</option>
                <option value="gemini-3.5-flash">Google Gemini 3.5 Flash (Advanced Multi-Modal Reasoning)</option>
                <option value="gpt-4o-mini">OpenAI GPT-4o-mini (High Accuracy Bengali Reasoning)</option>
                <option value="claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-300 uppercase text-[10px] tracking-wider block mb-1">
                Per-Message Profit Rate (মার্চেন্ট থেকে প্রতি মেসেজে কত টাকা কাটা হবে - BDT)
              </label>
              <Input
                type="number"
                step="0.01"
                value={config.perMessageCost ?? 0.25}
                onChange={(e) => updateField("perMessageCost", e.target.value)}
                className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs max-w-xs"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                সেন্ট্রাল মডেল খরচ প্রতি মেসেজে প্রায় ৳০.০২। আপনার সেট করা রেটে বাকি অংশ সরাসরি প্রফিট মার্জিন।
              </span>
            </div>

            <div>
              <label className="font-bold text-slate-300 uppercase text-[10px] tracking-wider block mb-1">
                Google Gemini API Key
              </label>
              <div className="relative">
                <Input
                  type={showSecret["gemini"] ? "text" : "password"}
                  value={config.geminiApiKey || ""}
                  onChange={(e) => updateField("geminiApiKey", e.target.value)}
                  placeholder="AIzaSy..."
                  className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => toggleSecret("gemini")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showSecret["gemini"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 uppercase text-[10px] tracking-wider block mb-1">
                OpenAI API Key
              </label>
              <div className="relative">
                <Input
                  type={showSecret["openai"] ? "text" : "password"}
                  value={config.openaiApiKey || ""}
                  onChange={(e) => updateField("openaiApiKey", e.target.value)}
                  placeholder="sk-proj-..."
                  className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => toggleSecret("openai")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showSecret["openai"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 uppercase text-[10px] tracking-wider block mb-1">
                Anthropic Claude API Key (Optional)
              </label>
              <div className="relative">
                <Input
                  type={showSecret["anthropic"] ? "text" : "password"}
                  value={config.anthropicApiKey || ""}
                  onChange={(e) => updateField("anthropicApiKey", e.target.value)}
                  placeholder="sk-ant-..."
                  className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => toggleSecret("anthropic")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showSecret["anthropic"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: VOICE & TELEPHONY (SIP/TWILIO) ================= */}
        {activeTab === "voice" && (
          <div className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-cyan-400" />
                Voice Telephony & Local SIP / VoIP
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                আন্তর্জাতিক কলিংয়ের জন্য Twilio অথবা বাংলাদেশের অভ্যন্তরীণ সাশ্রয়ী কলের জন্য Custom SIP (AmberIT / BTCL) কনফিগার করুন।
              </p>
            </div>

            {/* Server Outbound IP Banner for SIP Whitelisting */}
            <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-800/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-cyan-300 flex items-center gap-1.5 text-xs">
                  <Server className="w-4 h-4 text-cyan-400" />
                  সার্ভার আউটবাউন্ড স্ট্যাটিক আইপি (Static Outbound IP Whitelist)
                </span>
                <p className="text-[11px] text-cyan-200/80 mt-1">
                  AmberIT বা লোকাল আইপিটিএসপি (IPTSP SIP) পোর্টালে আপনার সার্ভারের এই আইপিটি হোয়াইটলিস্ট করুন:
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-700 text-cyan-300 font-mono text-xs font-bold">
                  {serverOutboundIp}
                </code>
                <button
                  type="button"
                  onClick={copyIp}
                  className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedIp ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedIp ? "কপিকৃত!" : "কপি"}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 uppercase text-[10px] tracking-wider block mb-1">
                Active Telephony Provider (ভয়েস কল প্রোভাইডার নির্বাচন)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateField("voiceProvider", "TWILIO")}
                  className={`p-3 rounded-2xl border text-left font-semibold cursor-pointer transition-all ${
                    config.voiceProvider === "TWILIO"
                      ? "border-cyan-500 bg-cyan-500/10 text-cyan-300"
                      : "border-slate-800 bg-slate-900 text-slate-400"
                  }`}
                >
                  Twilio Cloud Telephony
                  <span className="block text-[10px] font-normal text-slate-500 mt-0.5">
                    আন্তর্জাতিক ও অত্যন্ত স্ট্যাবল গ্লোবাল প্রোভাইডার
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => updateField("voiceProvider", "CUSTOM_SIP")}
                  className={`p-3 rounded-2xl border text-left font-semibold cursor-pointer transition-all ${
                    config.voiceProvider === "CUSTOM_SIP"
                      ? "border-cyan-500 bg-cyan-500/10 text-cyan-300"
                      : "border-slate-800 bg-slate-900 text-slate-400"
                  }`}
                >
                  Custom SIP / Local VoIP
                  <span className="block text-[10px] font-normal text-slate-500 mt-0.5">
                    AmberIT, BTCL বা লোকাল আইপি ট্রাঙ্ক (প্রতি মিনিট মাত্র ৳০.৪৫)
                  </span>
                </button>
              </div>
            </div>

            {config.voiceProvider === "TWILIO" ? (
              <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                <span className="font-bold text-slate-300 block text-[11px]">Twilio Credentials</span>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Twilio Account SID</label>
                  <Input
                    value={config.twilioAccountSid || ""}
                    onChange={(e) => updateField("twilioAccountSid", e.target.value)}
                    placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                    className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Twilio Auth Token</label>
                  <div className="relative">
                    <Input
                      type={showSecret["twilioToken"] ? "text" : "password"}
                      value={config.twilioAuthToken || ""}
                      onChange={(e) => updateField("twilioAuthToken", e.target.value)}
                      placeholder="••••••••••••••••"
                      className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecret("twilioToken")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showSecret["twilioToken"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Twilio Outbound Phone Number / Caller ID</label>
                  <Input
                    value={config.twilioPhoneNumber || ""}
                    onChange={(e) => updateField("twilioPhoneNumber", e.target.value)}
                    placeholder="+1234567890 বা +88096..."
                    className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                <span className="font-bold text-slate-300 block text-[11px]">Local SIP / IPTSP Configuration (AmberIT / BTCL)</span>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">SIP Server Host</label>
                    <Input
                      value={config.sipServer || ""}
                      onChange={(e) => updateField("sipServer", e.target.value)}
                      placeholder="sip.amberit.com.bd বা 103.xxx.xxx.xxx"
                      className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">SIP Port</label>
                    <Input
                      type="number"
                      value={config.sipPort ?? 5060}
                      onChange={(e) => updateField("sipPort", e.target.value)}
                      className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">SIP Username / Auth ID</label>
                    <Input
                      value={config.sipUsername || ""}
                      onChange={(e) => updateField("sipUsername", e.target.value)}
                      placeholder="096xxxxxxx"
                      className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">SIP Password</label>
                    <div className="relative">
                      <Input
                        type={showSecret["sipPass"] ? "text" : "password"}
                        value={config.sipPassword || ""}
                        onChange={(e) => updateField("sipPassword", e.target.value)}
                        placeholder="••••••••"
                        className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => toggleSecret("sipPass")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showSecret["sipPass"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Outbound Caller ID (মাস্কিং নাম্বার)</label>
                  <Input
                    value={config.sipCallerId || ""}
                    onChange={(e) => updateField("sipCallerId", e.target.value)}
                    placeholder="096xxxxxxx"
                    className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800 pt-4">
              <div>
                <label className="font-bold text-slate-300 uppercase text-[10px] tracking-wider block mb-1">
                  ElevenLabs / Voice TTS API Key
                </label>
                <div className="relative">
                  <Input
                    type={showSecret["ttsKey"] ? "text" : "password"}
                    value={config.ttsApiKey || ""}
                    onChange={(e) => updateField("ttsApiKey", e.target.value)}
                    placeholder="xi-api-key..."
                    className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecret("ttsKey")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showSecret["ttsKey"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 uppercase text-[10px] tracking-wider block mb-1">
                  Per-Minute Call Rate (মার্চেন্ট কল রেট - BDT)
                </label>
                <Input
                  type="number"
                  step="0.10"
                  value={config.perMinuteCallCost ?? 2.50}
                  onChange={(e) => updateField("perMinuteCallCost", e.target.value)}
                  className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: META & WHATSAPP ================= */}
        {activeTab === "meta" && (
          <div className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                Meta App & WhatsApp Embedded Signup
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                ১-ক্লিক ফেসবুক পেজ সংযোগ এবং মেটা অনুমোদিত হোয়াটসঅ্যাপ এমবেডেড সাইনআপ (WhatsApp Embedded Signup) কন্ট্রোল করুন।
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-800/50 text-[11px] text-blue-200 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span><strong>মার্চেন্টদের জন্য জিরো ম্যানুয়াল কপি-পেস্ট:</strong> এখানে একবার আপনার মেটা অ্যাপের ক্রেডেনশিয়াল সেভ করলেই মার্চেন্টরা কোনো টোকেন কপি না করে ১-ক্লিকে তাদের পেজ ও হোয়াটসঅ্যাপ বিজনেস যুক্ত করতে পারবে।</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-300 uppercase text-[10px] tracking-wider block mb-1">
                  Meta App ID
                </label>
                <Input
                  value={config.metaAppId || ""}
                  onChange={(e) => updateField("metaAppId", e.target.value)}
                  placeholder="123456789012345"
                  className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 uppercase text-[10px] tracking-wider block mb-1">
                  Meta App Secret
                </label>
                <div className="relative">
                  <Input
                    type={showSecret["metaSecret"] ? "text" : "password"}
                    value={config.metaAppSecret || ""}
                    onChange={(e) => updateField("metaAppSecret", e.target.value)}
                    placeholder="••••••••••••••••"
                    className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecret("metaSecret")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showSecret["metaSecret"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800 pt-4">
              <div>
                <label className="font-bold text-slate-300 uppercase text-[10px] tracking-wider block mb-1">
                  WhatsApp Embedded Signup Config ID (config_id)
                </label>
                <Input
                  value={config.metaConfigId || ""}
                  onChange={(e) => updateField("metaConfigId", e.target.value)}
                  placeholder="9876543210..."
                  className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Meta App Dashboard → WhatsApp → Embedded Signup Setup থেকে প্রাপ্ত Configuration ID.
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-300 uppercase text-[10px] tracking-wider block mb-1">
                  Meta Webhook Verify Token (hub.verify_token)
                </label>
                <Input
                  value={config.whatsappVerifyToken || "mogent_ai_secure_verify_token_2026"}
                  onChange={(e) => updateField("whatsappVerifyToken", e.target.value)}
                  className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 uppercase text-[10px] tracking-wider block mb-1">
                Permanent System User Access Token
              </label>
              <div className="relative">
                <Input
                  type={showSecret["systemToken"] ? "text" : "password"}
                  value={config.whatsappSystemToken || ""}
                  onChange={(e) => updateField("whatsappSystemToken", e.target.value)}
                  placeholder="EAA..."
                  className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => toggleSecret("systemToken")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showSecret["systemToken"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Business Manager → System Users থেকে প্রাপ্ত পার্মানেন্ট টোকেন (কখনো মেয়াদ শেষ হবে না)।
              </span>
            </div>
          </div>
        )}

        {/* ================= TAB 4: GOOGLE OAUTH & SHEETS ================= */}
        {activeTab === "google" && (
          <div className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                Google OAuth & Google Sheets Sync
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                ১-ক্লিক গুগল লগইন এবং মার্চেন্টদের অর্ডার স্বয়ংক্রিয়ভাবে তাদের গুগল শিটে সিঙ্ক করার মাস্টার এপিআই।
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-300 uppercase text-[10px] tracking-wider block mb-1">
                  Google Client ID (OAuth 2.0)
                </label>
                <Input
                  value={config.googleClientId || ""}
                  onChange={(e) => updateField("googleClientId", e.target.value)}
                  placeholder="xxxxx.apps.googleusercontent.com"
                  className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 uppercase text-[10px] tracking-wider block mb-1">
                  Google Client Secret
                </label>
                <div className="relative">
                  <Input
                    type={showSecret["googleSecret"] ? "text" : "password"}
                    value={config.googleClientSecret || ""}
                    onChange={(e) => updateField("googleClientSecret", e.target.value)}
                    placeholder="GOCSPX-••••••••"
                    className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecret("googleSecret")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showSecret["googleSecret"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4">
              <label className="font-bold text-slate-300 uppercase text-[10px] tracking-wider block mb-1">
                Google Sheets API Key / Service Account JSON
              </label>
              <div className="relative">
                <textarea
                  rows={3}
                  value={config.googleServiceAccountJson || ""}
                  onChange={(e) => updateField("googleServiceAccountJson", e.target.value)}
                  placeholder={`{"type": "service_account", "project_id": "..."}`}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-3 font-mono text-[11px]"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Google Cloud Console থেকে প্রাপ্ত Service Account JSON কি এখানে পেস্ট করুন।
              </span>
            </div>
          </div>
        )}

        {/* ================= TAB 5: PAYMENT GATEWAYS ================= */}
        {activeTab === "payment" && (
          <div className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-pink-400" />
                Payment Gateways (মার্চেন্ট ওয়ালেট রিচার্জ)
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                মার্চেন্টরা ওয়ালেটে টাকা রিচার্জ করার সময় এই মার্চেন্ট একাউন্টগুলোতে সরাসরি পেমেন্ট জমা হবে।
              </p>
            </div>

            {/* bKash Section */}
            <div className="space-y-3 rounded-2xl border border-pink-900/40 bg-pink-950/10 p-5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-pink-400 text-xs">bKash Checkout URL API</span>
                <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.bkashSandbox ?? true}
                    onChange={(e) => updateField("bkashSandbox", e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700"
                  />
                  <span>Sandbox / Test Mode</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">bKash App Key</label>
                  <Input
                    value={config.bkashAppKey || ""}
                    onChange={(e) => updateField("bkashAppKey", e.target.value)}
                    placeholder="Enter bKash App Key"
                    className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">bKash App Secret</label>
                  <Input
                    type="password"
                    value={config.bkashAppSecret || ""}
                    onChange={(e) => updateField("bkashAppSecret", e.target.value)}
                    placeholder="••••••••••••"
                    className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">bKash Username</label>
                  <Input
                    value={config.bkashUsername || ""}
                    onChange={(e) => updateField("bkashUsername", e.target.value)}
                    placeholder="sandboxUsername"
                    className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">bKash Password</label>
                  <Input
                    type="password"
                    value={config.bkashPassword || ""}
                    onChange={(e) => updateField("bkashPassword", e.target.value)}
                    placeholder="••••••••••••"
                    className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            {/* SSLCommerz Section */}
            <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/30 p-5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 text-xs">SSLCommerz (Cards / Banking)</span>
                <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.sslczSandbox ?? true}
                    onChange={(e) => updateField("sslczSandbox", e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700"
                  />
                  <span>Sandbox / Test Mode</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Store ID</label>
                  <Input
                    value={config.sslczStoreId || ""}
                    onChange={(e) => updateField("sslczStoreId", e.target.value)}
                    placeholder="testbox"
                    className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Store Password</label>
                  <Input
                    type="password"
                    value={config.sslczStorePassword || ""}
                    onChange={(e) => updateField("sslczStorePassword", e.target.value)}
                    placeholder="••••••••••••"
                    className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 6: SMS GATEWAYS ================= */}
        {activeTab === "sms" && (
          <div className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" />
                SMS Gateways (Greenweb & BulkSMSBD)
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                অর্ডার কনফার্মেশন, ডেলিভারি ট্র্যাকিং ও ওটিপির জন্য সেন্ট্রাল এসএমএস গেটওয়ে।
              </p>
            </div>

            {/* Server Outbound IP Banner for Greenweb Whitelisting */}
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-emerald-300 flex items-center gap-1.5 text-xs">
                  <Server className="w-4 h-4 text-emerald-400" />
                  Greenweb / Local SMS IP Whitelist
                </span>
                <p className="text-[11px] text-emerald-200/80 mt-1">
                  গ্রিনওয়েব ড্যাশবোর্ডে গিয়ে আপনার সার্ভারের এই স্ট্যাটিক আইপিটি অনুমোদিত করুন:
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="px-3 py-1.5 rounded-xl bg-slate-900 border border-emerald-700 text-emerald-300 font-mono text-xs font-bold">
                  {serverOutboundIp}
                </code>
                <button
                  type="button"
                  onClick={copyIp}
                  className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedIp ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedIp ? "কপিকৃত!" : "কপি"}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 uppercase text-[10px] tracking-wider block mb-1">
                Active SMS Provider
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateField("smsProvider", "GREENWEB")}
                  className={`p-3 rounded-2xl border text-left font-semibold cursor-pointer transition-all ${
                    config.smsProvider === "GREENWEB"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                      : "border-slate-800 bg-slate-900 text-slate-400"
                  }`}
                >
                  Greenweb SMS
                  <span className="block text-[10px] font-normal text-slate-500 mt-0.5">
                    বাংলাদেশের সবচেয়ে জনপ্রিয় ও ফাস্ট এসএমএস গেটওয়ে
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => updateField("smsProvider", "BULKSMSBD")}
                  className={`p-3 rounded-2xl border text-left font-semibold cursor-pointer transition-all ${
                    config.smsProvider === "BULKSMSBD"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                      : "border-slate-800 bg-slate-900 text-slate-400"
                  }`}
                >
                  BulkSMSBD
                  <span className="block text-[10px] font-normal text-slate-500 mt-0.5">
                    নির্ভরযোগ্য নন-মাস্কিং ও মাস্কিং এসএমএস সেবা
                  </span>
                </button>
              </div>
            </div>

            {config.smsProvider === "GREENWEB" ? (
              <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                <span className="font-bold text-slate-300 block text-[11px]">Greenweb API Token</span>
                <div className="relative">
                  <Input
                    type={showSecret["gwToken"] ? "text" : "password"}
                    value={config.greenwebToken || ""}
                    onChange={(e) => updateField("greenwebToken", e.target.value)}
                    placeholder="Enter Greenweb API Token"
                    className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecret("gwToken")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showSecret["gwToken"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                <span className="font-bold text-slate-300 block text-[11px]">BulkSMSBD Credentials</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">API Key</label>
                    <Input
                      type="password"
                      value={config.bulksmsApiKey || ""}
                      onChange={(e) => updateField("bulksmsApiKey", e.target.value)}
                      placeholder="Enter BulkSMSBD API Key"
                      className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Sender ID</label>
                    <Input
                      value={config.bulksmsSenderId || ""}
                      onChange={(e) => updateField("bulksmsSenderId", e.target.value)}
                      placeholder="88096..."
                      className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="font-bold text-slate-300 uppercase text-[10px] tracking-wider block mb-1">
                Per-SMS Cost (মার্চেন্ট প্রতি এসএমএস রেট - BDT)
              </label>
              <Input
                type="number"
                step="0.05"
                value={config.perSmsCost ?? 0.35}
                onChange={(e) => updateField("perSmsCost", e.target.value)}
                className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs max-w-xs"
              />
            </div>
          </div>
        )}

        {/* ================= TAB 7: CLOUD STORAGE ================= */}
        {activeTab === "storage" && (
          <div className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Cloud className="w-4 h-4 text-purple-400" />
                Cloud Storage (AWS S3 & Cloudflare R2)
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                কল রেকর্ডিং অডিও ফাইল, পিডিএফ ইনভয়েস এবং প্রোডাক্টের ছবি ক্লাউডে জমা রাখার স্টোরেজ।
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-300 uppercase text-[10px] tracking-wider block mb-1">
                Storage Provider
              </label>
              <div className="grid grid-cols-3 gap-3">
                {["LOCAL", "AWS_S3", "CLOUDFLARE_R2"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => updateField("storageProvider", p)}
                    className={`p-3 rounded-2xl border text-center font-semibold cursor-pointer transition-all ${
                      config.storageProvider === p
                        ? "border-purple-500 bg-purple-500/10 text-purple-300"
                        : "border-slate-800 bg-slate-900 text-slate-400"
                    }`}
                  >
                    {p === "LOCAL" ? "Local Server Disk" : p === "AWS_S3" ? "Amazon S3" : "Cloudflare R2 (Zero Egress)"}
                  </button>
                ))}
              </div>
            </div>

            {config.storageProvider !== "LOCAL" && (
              <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Access Key ID</label>
                    <Input
                      value={config.storageAccessKeyId || ""}
                      onChange={(e) => updateField("storageAccessKeyId", e.target.value)}
                      placeholder="AKIA..."
                      className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Secret Access Key</label>
                    <div className="relative">
                      <Input
                        type={showSecret["s3Secret"] ? "text" : "password"}
                        value={config.storageSecretAccessKey || ""}
                        onChange={(e) => updateField("storageSecretAccessKey", e.target.value)}
                        placeholder="••••••••••••••••"
                        className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => toggleSecret("s3Secret")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showSecret["s3Secret"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Bucket Name</label>
                    <Input
                      value={config.storageBucketName || ""}
                      onChange={(e) => updateField("storageBucketName", e.target.value)}
                      placeholder="mogent-media"
                      className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Custom Endpoint (Cloudflare R2)</label>
                    <Input
                      value={config.storageEndpoint || ""}
                      onChange={(e) => updateField("storageEndpoint", e.target.value)}
                      placeholder="https://<account_id>.r2.cloudflarestorage.com"
                      className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Public CDN / Media Domain URL</label>
                  <Input
                    value={config.storagePublicUrl || ""}
                    onChange={(e) => updateField("storagePublicUrl", e.target.value)}
                    placeholder="https://media.mogent.ai"
                    className="bg-slate-900 border-slate-800 text-white rounded-xl text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Global Save Button */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 py-3 px-6 cursor-pointer disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                সংরক্ষণ ও AES-256 এনক্রিপ্ট হচ্ছে...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Master Settings
              </>
            )}
          </Button>

          <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            সেভ করার সাথে সাথে প্ল্যাটফর্মের সকল মার্চেন্ট ১-ক্লিকে কার্যকর সার্ভিস পাবে
          </span>
        </div>
      </form>
    </div>
  );
}

