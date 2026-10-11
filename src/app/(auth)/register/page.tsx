"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  Store,
  Globe,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Phone,
  CheckCircle2,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [storeName, setStoreName] = useState("");
  const [slug, setSlug] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from store name
  const handleStoreNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStoreName(val);
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-");
    setSlug(autoSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          storeName,
          slug,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "রেজিস্ট্রেশন ব্যর্থ হয়েছে। অন্য ইমেইল বা স্টোর নেম চেষ্টা করুন।");
      }

      window.location.href = data.redirectUrl || `/${data.tenantSlug}/dashboard`;
    } catch (err: any) {
      setError(err.message || "রেজিস্ট্রেশন প্রক্রিয়ায় সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/50 hover:border-indigo-200 transition-all p-6 sm:p-8">
      {/* Card Title & Value Proposition */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-3 font-bengali">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>১৪ দিনের ফ্রি ট্রায়াল • কোনো ক্রেডিট কার্ড লাগবে না</span>
        </div>
        <h1 className="font-bengali font-bold text-2xl sm:text-[26px] text-slate-900 tracking-tight mb-1.5">
          ফ্রি মার্চেন্ট অ্যাকাউন্ট খুলুন
        </h1>
        <p className="font-bengali text-xs sm:text-sm text-slate-500">
          আপনার ফেসবুক পেজ, ওয়েবসাইট ও হোয়াটসঅ্যাপে ২৪/৭ সেলস অটোমেশন শুরু করুন
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs font-bengali">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-4 font-bengali">
        {/* Name & Store Name Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              আপনার পুরো নাম
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="উদা: রাইয়ান চৌধুরী"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-3 focus:ring-indigo-500/15 transition-all font-body"
              />
            </div>
          </div>

          {/* Store Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              স্টোর বা পেজের নাম
            </label>
            <div className="relative">
              <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                value={storeName}
                onChange={handleStoreNameChange}
                placeholder="উদা: আরবান ওয়্যার বিডি"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-3 focus:ring-indigo-500/15 transition-all font-body"
              />
            </div>
          </div>
        </div>

        {/* Business Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            বিজনেস ইমেইল
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="merchant@urbanwearbd.com"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-3 focus:ring-indigo-500/15 transition-all font-body"
            />
          </div>
        </div>

        {/* Store Slug / URL */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            ড্যাশবোর্ড URL স্ল্যাগ
          </label>
          <div className="relative flex rounded-xl border border-slate-300 overflow-hidden focus-within:border-indigo-600 focus-within:ring-3 focus-within:ring-indigo-500/15 transition-all">
            <span className="bg-slate-50 px-3 py-2.5 text-xs text-slate-500 border-r border-slate-300 select-none flex items-center font-mono">
              mogent.ai/
            </span>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              placeholder="urban-wear"
              className="w-full px-3 py-2.5 text-sm bg-white text-slate-900 placeholder-slate-400 focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            পাসওয়ার্ড (ন্যূনতম ৬ অক্ষর)
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-10 pr-11 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-3 focus:ring-indigo-500/15 transition-all font-body"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bengali font-bold text-sm shadow-sm shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>স্টোর তৈরি হচ্ছে...</span>
            </>
          ) : (
            <>
              <span>ফ্রি অ্যাকাউন্ট তৈরি করুন</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Feature Bullet Points */}
      <div className="mt-5 grid grid-cols-2 gap-2 text-[11px] text-slate-500 font-bengali">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>মেসেঞ্জার ও হোয়াটসঅ্যাপ সিঙ্ক</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Steadfast ও Pathao কুরিয়ার</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>স্বয়ংক্রিয় এআই ভয়েস কলিং</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>bKash অটো পেমেন্ট ট্র্যাকিং</span>
        </div>
      </div>

      {/* Bottom Switch to Login */}
      <div className="mt-6 pt-5 border-t border-slate-100 text-center font-bengali">
        <p className="text-xs text-slate-600">
          ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
          <Link
            href="/login"
            className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline transition-colors"
          >
            মার্চেন্ট লগইন করুন
          </Link>
        </p>
      </div>
    </div>
  );
}
