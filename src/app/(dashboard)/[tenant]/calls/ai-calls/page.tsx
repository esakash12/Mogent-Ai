import * as React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { getOrCreateTenant } from "@/lib/tenant";
import { PhoneCall, Bot, CheckCircle2, Wrench, ShieldAlert } from "lucide-react";
import { LiveCallTrigger } from "./live-call-trigger";

export const dynamic = "force-dynamic";

export default async function AiCallsPage({
  params,
}: {
  params: { tenant: string };
}) {
  const tenant = await getOrCreateTenant(params.tenant);

  if (!tenant) {
    notFound();
  }

  const calls = await prisma.callRecording.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
  });

  const superConfig = await prisma.superAdminConfig.findFirst();
  const isVoiceConfigured = Boolean(
    (superConfig?.twilioAccountSid && superConfig?.twilioAuthToken) ||
    (superConfig?.sipServer && superConfig?.sipUsername) ||
    (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
  );
  const activeVoiceProvider = superConfig?.voiceProvider || (superConfig?.sipServer ? "Custom SIP / VoIP" : "Twilio");

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Bot className="h-6 w-6 text-indigo-600" />
            AI Voice Calling & Order Verification
          </h1>
          {!isVoiceConfigured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
              <Wrench className="w-3.5 h-3.5 text-amber-600" />
              সার্ভিসটি মেইন্টেনেন্সে আছে
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          নতুন অর্ডারের জন্য AI স্বয়ংক্রিয়ভাবে কাস্টমারকে বাংলায় কল করে ডেলিভারি ও ঠিকানা ভেরিফাই করে।
        </p>
      </div>

      {!isVoiceConfigured && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                ভয়েস গেটওয়ে কনফিগারেশন পেন্ডিং (Under Maintenance)
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                এই সার্ভিসটি বর্তমানে মেইন্টেনেন্স বা কনফিগারেশনে রয়েছে। সুপার এডমিন থেকে Twilio/SIP সেন্ট্রাল API কানেক্ট করার সাথে সাথেই আপনার স্টোরের সকল অর্ডারে স্বয়ংক্রিয় ভয়েস কল শুরু হয়ে যাবে।
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Plug-and-Play Live Voice Call Demo */}
      <LiveCallTrigger
        tenantSlug={tenant.slug}
        storeName={tenant.name}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Calls Made</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {calls.length}
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Verified Orders</span>
          <div className="text-xl font-bold text-emerald-600 mt-1">
            {calls.filter((c) => c.callStatus === "COMPLETED").length}
          </div>
        </div>
        <div className="rounded-2xl border border-indigo-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Voice Engine</span>
          <div className="text-sm font-bold text-indigo-600 mt-1">
            {isVoiceConfigured ? `Bangla Voice Model (${activeVoiceProvider})` : "Gateway Pending"}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs text-center">
        <PhoneCall className="h-10 w-10 text-indigo-500 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-slate-900">
          {isVoiceConfigured ? "অটোমেটেড ভয়েস কলিং সক্রিয় আছে" : "ভয়েস কলিং রেডি (গেটওয়ে সংযুক্তির অপেক্ষায়)"}
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          কাস্টমার নতুন কোনো অর্ডার দিলে AI স্বয়ংক্রিয়ভাবে ৩০ সেকেন্ডের মধ্যে কল করে অর্ডারটি নিশ্চিত করবে।
        </p>
      </div>
    </div>
  );
}
