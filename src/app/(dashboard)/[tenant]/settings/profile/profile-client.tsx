"use client";

import * as React from "react";
import { Store, AlertTriangle, Save, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProfileClientProps {
  tenantSlug: string;
  initialName: string;
  initialContactPerson: string;
  initialBusinessEmail: string;
  initialPhone: string;
  initialBusinessType: string;
}

export function ProfileClient({
  tenantSlug,
  initialName,
  initialContactPerson,
  initialBusinessEmail,
  initialPhone,
  initialBusinessType,
}: ProfileClientProps) {
  const [name, setName] = React.useState(initialName);
  const [contactPerson, setContactPerson] = React.useState(initialContactPerson);
  const [businessEmail, setBusinessEmail] = React.useState(initialBusinessEmail);
  const [phone, setPhone] = React.useState(initialPhone);
  const [businessType, setBusinessType] = React.useState(initialBusinessType);
  const [saving, setSaving] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(null);
    setError(null);

    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/settings/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          contactPerson,
          businessEmail,
          phone,
          businessType,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess("প্রোফাইল তথ্য সফলভাবে সেভ হয়েছে!");
        setTimeout(() => setSuccess(null), 3500);
      } else {
        setError(data.error || "প্রোফাইল সেভ করতে সমস্যা হয়েছে।");
      }
    } catch (err: any) {
      setError("সার্ভারে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Store className="h-6 w-6 text-indigo-600" />
          General Profile & Business Info
        </h1>
        <p className="text-xs text-slate-400">
          আপনার অনলাইন শপ এবং কন্টাক্ট পারসনের তথ্য আপডেট করুন।
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Profile Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 rounded-2xl border border-border bg-white p-6 shadow-xs dark:bg-slate-950 space-y-4">
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Company Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 text-xs"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Contact Person</label>
              <Input
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Your Name"
                className="mt-1 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Business Email</label>
              <Input
                type="email"
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
                placeholder="merchant@example.com"
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Phone Number</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+8801XXXXXXXXX"
                className="mt-1 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase">Business Type</label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="mt-1 w-full rounded-xl border border-input p-2.5 text-xs bg-slate-50 dark:bg-slate-900"
            >
              <option value="E-commerce">E-commerce</option>
              <option value="Services">Services & Leads</option>
            </select>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> সেভ হচ্ছে...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5 mr-1" /> Save Changes
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Right 1 Col: Info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl border border-border bg-white p-5 shadow-xs dark:bg-slate-950 space-y-3">
            <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
              Store URL
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed break-all font-mono bg-slate-50 p-2.5 rounded-xl border">
              /{tenantSlug}
            </p>
            <p className="text-[10px] text-slate-400">
              আপনার স্টোরের ইউনিক স্ল্যাগ ও আইডেন্টিফায়ার।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
