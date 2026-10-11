"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Radio, Send, Users, MessageSquare, Facebook, CheckCircle2, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function BroadcastPage() {
  const params = useParams();
  const tenantSlug = params?.tenant as string;

  const [channel, setChannel] = React.useState("WHATSAPP");
  const [campaignName, setCampaignName] = React.useState("উইকেন্ড বিশেষ অফার ২০% ছাড়");
  const [message, setMessage] = React.useState(
    "প্রিয় কাস্টমার! আমাদের শপে চলছে বিশেষ উইকেন্ড ছাড়! সীমিত সময়ের জন্য যেকোনো অর্ডারে ২০% ছাড় পেতে আজই ইনবক্সে রিপ্লাই দিন।"
  );
  const [sent, setSent] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [campaigns, setCampaigns] = React.useState<any[]>([]);
  const [audience, setAudience] = React.useState({ WHATSAPP: 0, MESSENGER: 0, TOTAL: 0 });

  const loadCampaigns = React.useCallback(async () => {
    if (!tenantSlug) return;
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/broadcast`);
      if (res.ok) {
        const data = await res.json();
        if (data.campaigns) setCampaigns(data.campaigns);
        if (data.audience) setAudience(data.audience);
      }
    } catch (err) {
      console.error("Failed to load campaigns:", err);
    }
  }, [tenantSlug]);

  React.useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName,
          channel,
          messageText: message,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSent(true);
        loadCampaigns();
        setTimeout(() => setSent(false), 4000);
      } else {
        setError(data.error || "ক্যাম্পেইন শিডিউল করতে ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      setError("সার্ভারে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Radio className="h-6 w-6 text-indigo-600" />
          Broadcast Messaging (বাল্ক মেসেজিং)
        </h1>
        <p className="text-xs text-slate-400">
          আপনার সমস্ত অতীত কাস্টমারকে এক ক্লিকে অফার বা প্রমোশনাল মেসেজ পাঠান।
        </p>
      </div>

      {/* Audience Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-white p-4 shadow-xs dark:bg-slate-950">
          <span className="text-[11px] font-bold text-slate-400 uppercase">মোট গ্রাহক অডিয়েন্স</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {audience.TOTAL} জন
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-xs dark:bg-slate-950">
          <span className="text-[11px] font-bold text-emerald-600 uppercase flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp অডিয়েন্স
          </span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {audience.WHATSAPP} জন
          </div>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-xs dark:bg-slate-950">
          <span className="text-[11px] font-bold text-blue-600 uppercase flex items-center gap-1">
            <Facebook className="w-3.5 h-3.5" /> Messenger অডিয়েন্স
          </span>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {audience.MESSENGER} জন
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white p-6 shadow-xs dark:bg-slate-950 space-y-4">
        {sent ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-emerald-600 space-y-2">
            <CheckCircle2 className="h-10 w-10" />
            <h3 className="font-bold text-base">ব্রডকাস্ট সফলভাবে ডাটাবেজে শিডিউল হয়েছে!</h3>
            <p className="text-xs text-slate-400">মেটা রুলস মেনে ব্যাকগ্রাউন্ডে মেসেজগুলো পর্যায়ক্রমে পৌঁছে যাবে।</p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 uppercase text-[11px]">ক্যাম্পেইন নাম</label>
              <Input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="mt-1 text-xs"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 uppercase text-[11px]">চ্যানেল নির্বাচন করুন</label>
              <div className="flex gap-3 mt-1.5">
                <button
                  type="button"
                  onClick={() => setChannel("WHATSAPP")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold cursor-pointer ${
                    channel === "WHATSAPP"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30"
                      : "border-border text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <MessageSquare className="h-4 w-4" /> WhatsApp Broadcast
                </button>
                <button
                  type="button"
                  onClick={() => setChannel("MESSENGER")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold cursor-pointer ${
                    channel === "MESSENGER"
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30"
                      : "border-border text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Facebook className="h-4 w-4" /> Facebook Messenger
                </button>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 uppercase text-[11px]">মেসেজ টেক্সট</label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full mt-1.5 rounded-xl border border-input p-3 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 dark:bg-slate-900"
                required
              />
            </div>

            {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}

            <Button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-xs text-xs cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> শিডিউল হচ্ছে...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1.5" /> ব্রডকাস্ট চালু করুন
                </>
              )}
            </Button>
          </form>
        )}
      </div>

      {/* Past Campaigns Table */}
      <div className="rounded-2xl border border-border bg-white shadow-xs dark:bg-slate-950 overflow-hidden text-xs">
        <div className="p-4 border-b border-border font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          পূর্ববর্তী ব্রডকাস্ট হিস্ট্রি ({campaigns.length})
        </div>
        {campaigns.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            এখনো কোনো ব্রডকাস্ট ক্যাম্পেইন তৈরি করা হয়নি।
          </div>
        ) : (
          <div className="divide-y divide-border">
            {campaigns.map((c) => (
              <div key={c.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{c.name}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{c.messageText}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                    {c.channel}
                  </span>
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
