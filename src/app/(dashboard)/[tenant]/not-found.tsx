import * as React from "react";
import Link from "next/link";
import { Store, ArrowLeft } from "lucide-react";

export default function TenantNotFound() {
  return (
    <div className="flex h-[75vh] w-full flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 mb-4 shadow-sm">
        <Store className="h-8 w-8" />
      </div>

      <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
        404 • Store Not Found
      </span>

      <h2 className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        এই নামের কোনো মার্চেন্ট স্টোর নেই
      </h2>

      <p className="mt-2 max-w-md text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
        স্টোরের লিংকটি সঠিক কি না অনুগ্রহ করে নিশ্চিত করুন অথবা আপনার নিজস্ব ড্যাশবোর্ডে লগইন করুন।
      </p>

      <div className="mt-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> লগইন পেজে ফিরে যান
        </Link>
      </div>
    </div>
  );
}
