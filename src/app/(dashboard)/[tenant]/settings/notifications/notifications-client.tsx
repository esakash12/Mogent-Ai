"use client";

import * as React from "react";
import { Bell, Save, CheckCircle2, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotificationsClientProps {
  tenantSlug: string;
}

export function NotificationsClient({ tenantSlug }: NotificationsClientProps) {
  const [orderCancel, setOrderCancel] = React.useState(true);
  const [repeatOrder, setRepeatOrder] = React.useState(true);
  const [complaint, setComplaint] = React.useState(false);
  const [humanTransfer, setHumanTransfer] = React.useState(false);
  const [deliveryQuery, setDeliveryQuery] = React.useState(false);

  const [saving, setSaving] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(null);

    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/settings/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderCancel,
          repeatOrder,
          complaint,
          humanTransfer,
          deliveryQuery,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(data.message);
        setTimeout(() => setSuccess(null), 3500);
      }
    } catch (err) {
      console.error("Save notifications error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Bell className="h-6 w-6 text-indigo-600" />
          Notifications
        </h1>
        <p className="text-xs text-slate-400">
          কোন কোন গুরুত্বপূর্ণ ইভেন্টে আপনার অফিসিয়াল বিজনেস ইমেইলে অ্যালার্ট যাবে তা নির্ধারণ করুন।
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-white p-6 shadow-xs dark:bg-slate-950 space-y-4">
        {success && (
          <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:border-amber-900/60 dark:text-amber-200 flex items-start gap-2">
          <Info className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <span>নতুন অর্ডার ও ইনবক্স বার্তার ক্ষেত্রে ড্যাশবোর্ডে সাউন্ডসহ স্বয়ংক্রিয় পপআপ দেখানো হয় — এই পেজটি মূলত ইমেইল নোটিফিকেশন নিয়ন্ত্রণ করে।</span>
        </div>

        <div className="space-y-2.5 text-xs">
          <label className="flex items-center gap-3 p-3 rounded-xl border border-indigo-200 bg-indigo-50/40 dark:bg-indigo-950/30 cursor-pointer">
            <input
              type="checkbox"
              checked={orderCancel}
              onChange={(e) => setOrderCancel(e.target.checked)}
              className="h-4 w-4 rounded text-indigo-600"
            />
            <div>
              <strong className="block text-slate-900 dark:text-white">Order cancel request</strong>
              <span className="text-[11px] text-slate-500">কাস্টমার অর্ডার বাতিল করতে চাইলে (System default)</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl border border-indigo-200 bg-indigo-50/40 dark:bg-indigo-950/30 cursor-pointer">
            <input
              type="checkbox"
              checked={repeatOrder}
              onChange={(e) => setRepeatOrder(e.target.checked)}
              className="h-4 w-4 rounded text-indigo-600"
            />
            <div>
              <strong className="block text-slate-900 dark:text-white">Repeat order review</strong>
              <span className="text-[11px] text-slate-500">রিপিট কাস্টমারের অর্ডার প্লেস হলে (System default)</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer">
            <input
              type="checkbox"
              checked={complaint}
              onChange={(e) => setComplaint(e.target.checked)}
              className="h-4 w-4 rounded text-indigo-600"
            />
            <div>
              <strong className="block text-slate-900 dark:text-white">Customer Complaint</strong>
              <span className="text-[11px] text-slate-500">কাস্টমার কোনো অসন্তোষ বা অভিযোগ জানালে</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer">
            <input
              type="checkbox"
              checked={humanTransfer}
              onChange={(e) => setHumanTransfer(e.target.checked)}
              className="h-4 w-4 rounded text-indigo-600"
            />
            <div>
              <strong className="block text-slate-900 dark:text-white">Human Representative Hand-off</strong>
              <span className="text-[11px] text-slate-500">কাস্টমার সরাসরি প্রতিনিধির সাথে কথা বলতে চাইলে</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer">
            <input
              type="checkbox"
              checked={deliveryQuery}
              onChange={(e) => setDeliveryQuery(e.target.checked)}
              className="h-4 w-4 rounded text-indigo-600"
            />
            <div>
              <strong className="block text-slate-900 dark:text-white">Delivery status query</strong>
              <span className="text-[11px] text-slate-500">কাস্টমার ডেলিভারি স্ট্যাটাস জানতে চাইলে</span>
            </div>
          </label>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> সেভ হচ্ছে...
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 mr-1" /> Save Notifications
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
