"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Zap,
  Phone,
  ShieldCheck,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "লগইন ব্যর্থ হয়েছে। অনুগ্রহ করে তথ্য যাচাই করুন।");
      }

      const searchParams = new URLSearchParams(window.location.search);
      const redirectParam = searchParams.get("redirect");
      const targetUrl = redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")
        ? redirectParam
        : data.redirectUrl || (data.tenantSlug ? `/${data.tenantSlug}/dashboard` : "/dashboard");

      window.location.href = targetUrl;
    } catch (err: any) {
      setError(err.message || "লগইন প্রক্রিয়ায় সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = () => {
    if (!phone || phone.length < 10) {
      setError("সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন");
      return;
    }
    setError("মোবাইল ওটিপি ভেরিফিকেশন বর্তমানে রক্ষণাবেক্ষণে রয়েছে। অনুগ্রহ করে ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন।");
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("অনুগ্রহ করে ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন।");
  };

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/50 hover:border-indigo-200 transition-all p-6 sm:p-8">
      {/* Card Header & Subtitle */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold mb-3 font-bengali">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>মার্চেন্ট পোর্টাল v2.0</span>
        </div>
        <h1 className="font-bengali font-bold text-2xl sm:text-[26px] text-slate-900 tracking-tight mb-1.5">
          আপনার অ্যাকাউন্টে লগইন করুন
        </h1>
        <p className="font-bengali text-xs sm:text-sm text-slate-500">
          স্টোরের চ্যাট, ফোন কল ও অটোমেটেড অর্ডার দেখতে প্রবেশ করুন
        </p>
      </div>



      {/* Auth Mode Switcher Tabs */}
      <div className="p-1 rounded-xl bg-slate-100 border border-slate-200 grid grid-cols-2 gap-1 mb-5 font-bengali text-xs font-semibold">
        <button
          type="button"
          onClick={() => setAuthMode("email")}
          className={`py-2 px-3 rounded-lg text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
            authMode === "email"
              ? "bg-white text-slate-900 shadow-2xs border border-slate-200 font-bold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Mail className="w-4 h-4 text-slate-500" />
          <span>ইমেইল ও পাসওয়ার্ড</span>
        </button>

        <button
          type="button"
          onClick={() => setAuthMode("phone")}
          className={`py-2 px-3 rounded-lg text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
            authMode === "phone"
              ? "bg-white text-slate-900 shadow-2xs border border-slate-200 font-bold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Phone className="w-4 h-4 text-slate-500" />
          <span>মোবাইল ও ওটিপি</span>
        </button>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs font-bengali">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* FORM: EMAIL & PASSWORD */}
      {authMode === "email" ? (
        <form onSubmit={handleEmailSubmit} className="space-y-4 font-bengali">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              বিজনেস ইমেইল বা ইউজারনেম
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="merchant@yourstore.com"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-3 focus:ring-indigo-500/15 transition-all font-body"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                পাসওয়ার্ড
              </label>
              <span className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer">
                পাসওয়ার্ড ভুলে গেছেন?
              </span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-11 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-3 focus:ring-indigo-500/15 transition-all font-body"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="পাসওয়ার্ড দেখুন"
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-colors"
              />
              <span className="text-xs text-slate-600">এই ডিভাইসে লগইন সেশন মনে রাখুন</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bengali font-bold text-sm shadow-sm shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>যাচাই করা হচ্ছে...</span>
              </>
            ) : (
              <>
                <span>লগইন করুন</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      ) : (
        /* FORM: MOBILE & OTP */
        <form onSubmit={handlePhoneSubmit} className="space-y-4 font-bengali">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              মার্চেন্ট মোবাইল নম্বর
            </label>
            <div className="flex rounded-xl border border-slate-300 overflow-hidden focus-within:border-indigo-600 focus-within:ring-3 focus-within:ring-indigo-500/15 transition-all">
              <div className="bg-slate-50 px-3 py-2.5 border-r border-slate-300 flex items-center gap-1.5 shrink-0 select-none">
                <span className="bd-flag-icon" />
                <span className="text-xs font-semibold text-slate-700 font-body">+880</span>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="1711223344"
                maxLength={11}
                className="w-full px-3 py-2.5 text-sm bg-white text-slate-900 placeholder-slate-400 focus:outline-none font-body"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              আপনার নম্বরে ৬ ডিজিটের ভেরিফিকেশন এসএমএস পাঠানো হবে।
            </p>
          </div>

          {!otpSent ? (
            <button
              type="button"
              onClick={handleSendOtp}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bengali font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>ওটিপি (OTP) কোড পাঠান</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ৬-ডিজিট ওটিপি কোড
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="w-full px-3 py-2.5 text-center text-lg font-mono tracking-widest bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-3 focus:ring-indigo-500/15"
              />
              <button
                type="submit"
                className="w-full mt-3 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bengali font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>ওটিপি যাচাই করে প্রবেশ করুন</span>
              </button>
            </div>
          )}
        </form>
      )}

      {/* Bottom Switch to Register */}
      <div className="mt-6 pt-5 border-t border-slate-100 text-center font-bengali">
        <p className="text-xs text-slate-600">
          নতুন মার্চেন্ট?{" "}
          <Link
            href="/register"
            className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline transition-colors"
          >
            ১৪ দিনের ফ্রি ট্রায়াল শুরু করুন
          </Link>
        </p>
      </div>
    </div>
  );
}
