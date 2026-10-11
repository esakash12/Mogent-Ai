"use client";

import * as React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[GLOBAL SYSTEM ERROR CAUGHT]:", error);
  }, [error]);

  return (
    <html lang="bn">
      <body className="bg-slate-50 text-slate-800 font-sans antialiased min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 text-2xl font-bold">
            ⚠️
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            সিস্টেমে সাময়িক ত্রুটি দেখা দিয়েছে
          </h1>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            অ্যাপ্লিকেশনের মূল মডিউলে একটি সমস্যা দেখা দিয়েছে। আপনার ডেটা সুরক্ষিত রয়েছে। অনুগ্রহ করে পেজটি পুনরায় লোড করুন।
          </p>

          {error?.digest && (
            <p className="text-xs text-slate-400 font-mono mb-6">
              রেফারেন্স কোড: {error.digest}
            </p>
          )}

          <button
            type="button"
            onClick={() => reset()}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            পুনরায় লোড করুন
          </button>
        </div>
      </body>
    </html>
  );
}
