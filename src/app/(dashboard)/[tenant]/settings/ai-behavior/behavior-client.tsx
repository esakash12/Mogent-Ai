"use client";

import * as React from "react";
import { Bot, Save, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BehaviorClientProps {
  tenantSlug: string;
  initialTemplate: string;
  initialPhotoAction: string;
  initialChangeAction: string;
  initialEnableCatalogCards?: boolean;
  initialCatalogLocationUrl?: string;
}

export function BehaviorClient({
  tenantSlug,
  initialTemplate,
  initialPhotoAction,
  initialChangeAction,
  initialEnableCatalogCards = true,
  initialCatalogLocationUrl = "",
}: BehaviorClientProps) {
  const [template, setTemplate] = React.useState(
    initialTemplate ||
      "আপনার অর্ডারটি সফলভাবে কনফার্ম করা হয়েছে!\n\n" +
        "অর্ডার রেফারেন্স: {{order_ref}}\n" +
        "আইটেম: {{item_lines}}\n" +
        "ডেলিভারি চার্জ: ৳{{delivery_charge}}\n" +
        "সর্বমোট প্রদেয় মূল্য: ৳{{total}}\n\n" +
        "ডেলিভারির ঠিকানা: {{address}}"
  );
  const [photoAction, setPhotoAction] = React.useState(initialPhotoAction || "ASK_NEVER_GUESS");
  const [changeAction, setChangeAction] = React.useState(initialChangeAction || "HANDOFF_TO_TEAM");
  const [enableCatalogCards, setEnableCatalogCards] = React.useState<boolean>(initialEnableCatalogCards);
  const [catalogLocationUrl, setCatalogLocationUrl] = React.useState<string>(initialCatalogLocationUrl);
  const [saving, setSaving] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(null);
    setError(null);

    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/settings/ai-behavior`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderConfirmationTemplate: template,
          unknownPhotoAction: photoAction,
          orderChangeAction: changeAction,
          enableCatalogCards,
          catalogLocationUrl,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(data.message);
        setTimeout(() => setSuccess(null), 3500);
      } else {
        setError(data.error || "সেটিংস সেভ করতে ব্যর্থ হয়েছে।");
      }
    } catch (err) {
      setError("সার্ভারে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Bot className="h-6 w-6 text-indigo-600" />
          AI Behavior Rules
        </h1>
        <p className="text-xs text-slate-400">
          অর্ডার কনফার্মেশন ফরম্যাট, ক্যাটালগ বর্হিভূত ছবির ক্ষেত্রে বটের সিদ্ধান্ত ও অর্ডার পরিবর্তনের নিয়মাবলী।
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-white p-6 shadow-xs dark:bg-slate-950 space-y-6">
        {success && (
          <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs">
            {error}
          </div>
        )}

        {/* 1. Order Confirmation Template */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-900 dark:text-white block">
            Order Confirmation Message Template
          </label>
          <p className="text-[11px] text-slate-400">
            Write your own format below. Prices always come from verified totals.
          </p>

          <textarea
            rows={5}
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="w-full rounded-xl border border-input bg-slate-50 dark:bg-slate-900 p-3 text-xs leading-relaxed font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />

          <div className="text-[10px] text-slate-400">
            Available Placeholders: <code className="text-indigo-600">{"{{customer_name}}"}</code>,{" "}
            <code className="text-indigo-600">{"{{phone}}"}</code>,{" "}
            <code className="text-indigo-600">{"{{address}}"}</code>,{" "}
            <code className="text-indigo-600">{"{{total}}"}</code>,{" "}
            <code className="text-indigo-600">{"{{order_ref}}"}</code>
          </div>
        </div>

        {/* 2. Customer Photo not in catalog */}
        <div className="space-y-3 border-t border-border pt-5">
          <label className="text-xs font-bold text-slate-900 dark:text-white block">
            When a customer's photo isn't in catalog
          </label>

          <div className="space-y-2 text-xs">
            <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer ${photoAction === "ASK_NEVER_GUESS" ? "border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30" : "border-border"}`}>
              <input
                type="radio"
                name="photo_rule"
                checked={photoAction === "ASK_NEVER_GUESS"}
                onChange={() => setPhotoAction("ASK_NEVER_GUESS")}
                className="mt-0.5 text-indigo-600"
              />
              <div>
                <strong className="block text-slate-900 dark:text-white">System default (Recommended)</strong>
                <span className="text-[11px] text-slate-500">
                  Ask the customer instead of guessing a look-alike product.
                </span>
              </div>
            </label>

            <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer ${photoAction === "SUGGEST_SIMILAR" ? "border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30" : "border-border"}`}>
              <input
                type="radio"
                name="photo_rule"
                checked={photoAction === "SUGGEST_SIMILAR"}
                onChange={() => setPhotoAction("SUGGEST_SIMILAR")}
                className="mt-0.5"
              />
              <div>
                <strong className="block text-slate-900 dark:text-white">Suggest similar products</strong>
                <span className="text-[11px] text-slate-500">
                  The assistant may suggest close catalog matches.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* 3. Order Changes after confirmation */}
        <div className="space-y-3 border-t border-border pt-5">
          <label className="text-xs font-bold text-slate-900 dark:text-white block">
            When a customer changes an order after confirmation
          </label>

          <div className="space-y-2 text-xs">
            <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer ${changeAction === "HANDOFF_TO_TEAM" ? "border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30" : "border-border"}`}>
              <input
                type="radio"
                name="order_change"
                checked={changeAction === "HANDOFF_TO_TEAM"}
                onChange={() => setChangeAction("HANDOFF_TO_TEAM")}
                className="mt-0.5 text-indigo-600"
              />
              <div>
                <strong className="block text-slate-900 dark:text-white">System default (Recommended)</strong>
                <span className="text-[11px] text-slate-500">
                  AI updates pending orders itself; processing/shipped orders are handed to your team.
                </span>
              </div>
            </label>

            <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer ${changeAction === "ALWAYS_HANDOFF" ? "border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30" : "border-border"}`}>
              <input
                type="radio"
                name="order_change"
                checked={changeAction === "ALWAYS_HANDOFF"}
                onChange={() => setChangeAction("ALWAYS_HANDOFF")}
                className="mt-0.5"
              />
              <div>
                <strong className="block text-slate-900 dark:text-white">Always hand off changes</strong>
                <span className="text-[11px] text-slate-500">
                  Any change request after confirmation goes to your human team.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* 4. Interactive Product Cards & Catalog Settings */}
        <div className="space-y-3 border-t border-border pt-5">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-bold text-slate-900 dark:text-white block">
                ইন্টারঅ্যাকটিভ প্রোডাক্ট কার্ড ও ক্যারোসেল (Messenger Product Cards)
              </label>
              <p className="text-[11px] text-slate-500">
                কাস্টমার ছবি/ভয়েসে প্রোডাক্ট খুঁজতে চাইলে ছবি, দাম এবং &quot;এটি নিতে চাই&quot; বাটনসহ ইন্টারঅ্যাকটিভ কার্ড পাঠাবে।
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableCatalogCards}
                onChange={(e) => setEnableCatalogCards(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="pt-2">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
              ক্যাটালগ / শপ বা ওয়েবসাইট লিংক (ঐচ্ছিক)
            </label>
            <input
              type="url"
              value={catalogLocationUrl}
              onChange={(e) => setCatalogLocationUrl(e.target.value)}
              placeholder="https://yourstore.com/shop অথবা ফেসবুক পেজ শপের লিংক"
              className="w-full text-xs p-2.5 rounded-xl border border-border bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              ক্যাটালগ কার্ড বন্ধ থাকলে অথবা কাস্টমার বিস্তারিত লিংক চাইলে এআই স্বয়ংক্রিয়ভাবে এই লিংক পাঠিয়ে দেবে।
            </p>
          </div>
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
                <Save className="h-3.5 w-3.5 mr-1" /> Save AI Behavior
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
