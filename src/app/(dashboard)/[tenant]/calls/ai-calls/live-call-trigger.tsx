"use client";

import * as React from "react";
import { PhoneCall, Sparkles, Mic, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveCallModal } from "@/components/voice/live-call-modal";

interface LiveCallTriggerProps {
  tenantSlug: string;
  storeName: string;
}

export function LiveCallTrigger({ tenantSlug, storeName }: LiveCallTriggerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 p-6 shadow-xs bg-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
              <PhoneCall className="h-7 w-7 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  প্লাগ-অ্যান্ড-প্লে ব্রাউজার এআই ভয়েস কল ডেমো
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-300">
                  <Radio className="w-2.5 h-2.5 animate-pulse" /> লাইভ রেডি
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
                কোনো সিম বা টেলিকম ব্যালেন্স ছাড়াই ব্রাউজার মাইক্রোফোন দিয়ে সরাসরি এআই সেলস এজেন্টের সাথে কথা বলুন। এআই রিয়েল-টাইমে বাংলায় মুখে উত্তর দেবে!
              </p>
            </div>
          </div>

          <Button
            onClick={() => setIsOpen(true)}
            className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs px-5 py-3 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Mic className="h-4 w-4" />
            <span>এখনই লাইভ কল করুন (Start Call)</span>
          </Button>
        </div>
      </div>

      <LiveCallModal
        tenantSlug={tenantSlug}
        storeName={storeName}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
