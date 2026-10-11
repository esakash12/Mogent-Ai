"use client";

import * as React from "react";
import { Shield, Lock, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SecurityClientProps {
  tenantSlug: string;
}

export function SecurityClient({ tenantSlug }: SecurityClientProps) {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না।");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/settings/security`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(data.message);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setSuccess(null), 4000);
      } else {
        setError(data.error || "পাসওয়ার্ড পরিবর্তনে সমস্যা হয়েছে।");
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
          <Shield className="h-6 w-6 text-indigo-600" />
          Change Password & Security
        </h1>
        <p className="text-xs text-slate-400">
          আপনার মার্চেন্ট ড্যাশবোর্ড একাউন্টের পাসওয়ার্ড পরিবর্তন ও সুরক্ষা নিশ্চিত করুন।
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Change Password Form */}
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

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              বর্তমান পাসওয়ার্ড (Current Password)
            </label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="বর্তমান পাসওয়ার্ড দিন"
              className="mt-1.5 text-xs"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              নতুন পাসওয়ার্ড (New Password)
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="কমপক্ষে ৬ অক্ষরের নতুন পাসওয়ার্ড"
              className="mt-1.5 text-xs"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              নতুন পাসওয়ার্ড নিশ্চিত করুন (Confirm Password)
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="নতুন পাসওয়ার্ড পুনরায় লিখুন"
              className="mt-1.5 text-xs"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> পাসওয়ার্ড পরিবর্তন হচ্ছে...
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5 mr-1" /> আপডেট পাসওয়ার্ড
              </>
            )}
          </Button>
        </form>

        {/* Right 1 Col: Security Tips */}
        <div className="lg:col-span-1 rounded-2xl border border-border bg-white p-5 shadow-xs dark:bg-slate-950 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Security Tips
          </h3>
          <ul className="text-xs text-slate-500 space-y-2 list-disc list-inside leading-relaxed">
            <li>শক্তিশালী পাসওয়ার্ড ব্যবহার করুন (অক্ষর, নম্বর ও চিহ্নের মিশ্রণ)।</li>
            <li>অন্য কারো সাথে পাসওয়ার্ড শেয়ার করবেন না।</li>
            <li>পাসওয়ার্ড নিয়মিত বিরতিতে পরিবর্তন করুন।</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
