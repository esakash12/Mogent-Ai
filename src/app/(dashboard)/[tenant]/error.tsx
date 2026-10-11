"use client";

import * as React from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Dashboard error caught by boundary:", error);
  }, [error]);

  return (
    <div className="flex h-[75vh] w-full flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 mb-4 shadow-sm">
        <AlertTriangle className="h-8 w-8" />
      </div>

      <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
        সাময়িক কারিগরি সমস্যা হয়েছে
      </h2>
      <p className="mt-2 max-w-md text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
        সার্ভার বা ডেটাবেজ সংযোগে সাময়িক বিঘ্ন ঘটেছে। অনুগ্রহ করে পেজটি রিফ্রেশ করুন অথবা পুনরায় চেষ্টা করুন।
      </p>

      {process.env.NODE_ENV !== "production" && error?.message && (
        <div className="mt-3 max-w-md rounded-xl bg-slate-100 dark:bg-slate-900 px-3 py-1.5 text-[11px] text-slate-500 font-mono">
          ত্রুটির বিবরণ: {error.message.substring(0, 100)}...
        </div>
      )}
      {error?.digest && (
        <div className="mt-2 text-[10px] text-slate-400 font-mono">
          Error Reference: {error.digest}
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <Button
          onClick={() => reset()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm cursor-pointer"
        >
          <RefreshCcw className="h-3.5 w-3.5 mr-1.5" /> পুনরায় চেষ্টা করুন
        </Button>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <Home className="h-3.5 w-3.5" /> হোমপেজে যান
        </Link>
      </div>
    </div>
  );
}
