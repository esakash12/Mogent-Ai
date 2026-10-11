import * as React from "react";
import Link from "next/link";
import { Store, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 mb-6 shadow-sm">
        <Store className="h-8 w-8" />
      </div>

      <span className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
        404 • Not Found
      </span>

      <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        পেজ বা স্টোরটি খুঁজে পাওয়া যায়নি
      </h1>

      <p className="mt-2 max-w-md text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
        আপনি যে ইউআরএলটি খুঁজছেন তা মুছে ফেলা হয়েছে অথবা স্টোরের ঠিকানাটি সঠিক নয়।
      </p>

      <div className="mt-6 flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-colors"
        >
          <Home className="h-4 w-4" /> হোমপেজে যান
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> লগইন করুন
        </Link>
      </div>
    </div>
  );
}
