import * as React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { getOrCreateTenant } from "@/lib/tenant";
import { UserCheck, Shield, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function ActivityLogPage({
  params,
}: {
  params: { tenant: string };
}) {
  const tenant = await getOrCreateTenant(params.tenant);

  if (!tenant) {
    notFound();
  }

  const logs = await prisma.activityLog.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-indigo-600" />
          Activity Log (Audit Trail)
        </h1>
        <p className="text-xs text-slate-400">
          সিস্টেমের সমস্ত স্টাফ, ব্যাকগ্রাউন্ড শিডিউলার ও AI বটের কাজের পূর্ণাঙ্গ অডিট হিস্ট্রি।
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-white shadow-xs dark:bg-slate-950 overflow-hidden">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Shield className="h-10 w-10 text-slate-300 mb-2" />
            <h4 className="text-xs font-bold text-slate-700">কোনো অডিট লগ রেকর্ড নেই</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              স্বয়ংক্রিয় ব্যাকগ্রাউন্ড অ্যাক্টিভিটি ঘটলে এখানে দেখা যাবে।
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/80 text-xs">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start justify-between p-4 hover:bg-slate-50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.action}</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">{log.details}</p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {formatDate(log.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
