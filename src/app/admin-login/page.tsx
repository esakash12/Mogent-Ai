"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, Mail, ArrowRight, Loader2, AlertCircle, KeyRound, Crown, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@mogent.ai");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "লগইন ব্যর্থ হয়েছে।");
      }

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "সুপার এডমিন লগইন প্রক্রিয়ায় সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-8 px-4 sm:px-6 relative overflow-hidden font-body font-bengali">
      {/* Ambient Mesh Glow */}
      <div className="ambient-mesh-wrap pointer-events-none -z-10">
        <div className="ambient-glow-indigo" />
        <div className="ambient-glow-sky" />
      </div>

      <header className="w-full max-w-md mx-auto flex items-center justify-between pb-6 relative z-10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-xl shadow-xs">
            M
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-bold text-xl text-slate-900 leading-tight">Mogent AI</span>
            <span className="text-[11px] text-slate-500">সুপার এডমিন গেটওয়ে</span>
          </div>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg bg-white border border-slate-200 transition-all shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>ওয়েবসাইটে ফিরুন</span>
        </Link>
      </header>

      <main className="w-full max-w-md mx-auto my-auto relative z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 mx-auto flex items-center justify-center text-amber-600 font-bold mb-3 shadow-2xs">
              <Crown className="w-6 h-6 text-amber-600 fill-current" />
            </div>
            <h1 className="font-bold text-2xl text-slate-900 tracking-tight">
              সুপার এডমিন পোর্টাল
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Mogent AI মাস্টার প্ল্যাটফর্ম অ্যাডমিনিস্ট্রেশন
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 text-[11px] mb-1.5">
                মাস্টার এডমিন ইমেইল
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@mogent.ai"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/15 transition-all text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 text-[11px] mb-1.5">
                মাস্টার পাসওয়ার্ড
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/15 transition-all text-xs font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>যাচাই হচ্ছে...</span>
                </>
              ) : (
                <>
                  <span>মাস্টার পোর্টালে প্রবেশ করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>


        </div>
      </main>

      <footer className="w-full max-w-md mx-auto text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Mogent AI Platform
      </footer>
    </div>
  );
}
