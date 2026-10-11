"use client";

import React, { useState } from "react";
import { DollarSign, Save, CheckCircle2, Loader2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BillingSettingsClient({
  initialCost,
}: {
  initialCost: number;
}) {
  const [perMessageCost, setPerMessageCost] = useState(String(initialCost || 0.25));
  const [monthlyFee, setMonthlyFee] = useState("3000");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          perMessageCost: parseFloat(perMessageCost) || 0.25,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "বিলিং সেটিংস সেভ করতে সমস্যা হয়েছে।");
      }

      setSuccessMsg("বিলিং ও প্রফিট মার্জিন সফলভাবে সেভ হয়েছে!");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "সার্ভারে সমস্যা হয়েছে।");
    } finally {
      setSaving(false);
    }
  };

  const costNum = parseFloat(perMessageCost) || 0.25;
  const estimatedProfit = Math.max(0, costNum - 0.02);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-cyan-400" />
          Pricing & Profit Margins
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          সুপার অ্যাডমিন প্রফিট মার্জিন কন্ট্রোল — প্রতি মেসেজে ক্লায়েন্টের ওয়ালেট থেকে কত টাকা কাটা হবে তা নির্ধারণ করুন।
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl flex items-center gap-2 text-xs">
          <span>{errorMsg}</span>
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="rounded-3xl border border-slate-800 bg-slate-950 p-7 space-y-5 text-xs shadow-xl"
      >
        <div>
          <label className="font-bold text-slate-300 uppercase text-[10px] tracking-wider block mb-1">
            Per-Message Deduction Rate (মার্চেন্ট প্রতি মেসেজ রেট - BDT)
          </label>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-white font-bold text-sm">৳</span>
            <Input
              type="number"
              step="0.01"
              value={perMessageCost}
              onChange={(e) => setPerMessageCost(e.target.value)}
              className="bg-slate-900 border-slate-800 text-white max-w-xs text-xs rounded-xl"
            />
          </div>
          <div className="mt-2.5 p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-cyan-300 text-[11px] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 flex-shrink-0 text-cyan-400" />
            <span>
              সুপার অ্যাডমিন মার্জিন হিসাব: সেন্ট্রাল AI খরচ প্রায় ৳০.০২/মেসেজ। আপনার সেট করা ৳{costNum.toFixed(2)}-এ আপনার নিট লাভ প্রতি মেসেজে ৳{estimatedProfit.toFixed(2)}!
            </span>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-4">
          <label className="font-bold text-slate-300 uppercase text-[10px] tracking-wider block mb-1">
            Standard Plan Monthly Subscription Fee (BDT)
          </label>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-white font-bold text-sm">৳</span>
            <Input
              type="number"
              value={monthlyFee}
              onChange={(e) => setMonthlyFee(e.target.value)}
              className="bg-slate-900 border-slate-800 text-white max-w-xs text-xs rounded-xl"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800">
          <Button
            type="submit"
            disabled={saving}
            className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-cyan-500/20 py-2.5 px-5 cursor-pointer disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                সংরক্ষণ হচ্ছে...
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Save Pricing Config
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
