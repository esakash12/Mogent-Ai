import * as React from "react";
import prisma from "@/lib/db";
import { formatCurrencyBdt } from "@/lib/utils";
import Link from "next/link";
import {
  Users,
  DollarSign,
  MessageSquare,
  ShoppingBag,
  TrendingUp,
  Activity,
  Server,
  Zap,
  ShieldCheck,
  Cpu,
  PhoneCall,
  ExternalLink,
  ChevronRight,
  Database,
  Radio,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SuperAdminOverviewPage() {
  const dbStart = Date.now();
  let dbLatencyMs = 0;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
  } catch {
    dbLatencyMs = -1;
  }

  // Parallel database analytics aggregation
  const [
    totalTenants,
    activeTenantsCount,
    totalOrders,
    totalMessages,
    ordersSumResult,
    allWallets,
    latestTenants,
    recentOrders,
    config,
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { orders: { some: {} } } }),
    prisma.order.count(),
    prisma.message.count(),
    prisma.order.aggregate({ _sum: { totalAmount: true } }),
    prisma.wallet.findMany(),
    prisma.tenant.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        wallet: true,
        _count: { select: { orders: true, products: true, channels: true } },
      },
    }),
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        tenant: { select: { name: true, slug: true } },
      },
    }),
    prisma.superAdminConfig.findFirst(),
  ]);

  const totalMerchantBalances = allWallets.reduce((acc, w) => acc + (w.balanceBdt || 0), 0);
  const platformGmv = ordersSumResult._sum.totalAmount || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "PROCESSING":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "CANCELLED":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default:
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Platform Master Control
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold">
              ROOT
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            সুপার অ্যাডমিন সেন্ট্রাল কমান্ড — সমগ্র প্ল্যাটফর্মের মার্চেন্ট, লাইভ GMV, এপিআই মার্জিন ও গেটওয়ে অবজারভাবিলিটি।
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/api-settings"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-bold transition-colors"
          >
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>Master APIs</span>
          </Link>
          <Link
            href="/admin/tenants"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-sm shadow-indigo-600/30"
          >
            <Users className="h-3.5 w-3.5" />
            <span>Manage Merchants</span>
          </Link>
        </div>
      </div>

      {/* KPI Metric Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Platform GMV */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800/90 bg-gradient-to-b from-slate-900/90 to-slate-950 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Platform GMV
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-3">
            {formatCurrencyBdt(platformGmv)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
            <span className="text-emerald-400 font-bold">Total Transacted</span> across all stores
          </p>
        </div>

        {/* Merchant Wallet Escrow Float */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800/90 bg-gradient-to-b from-slate-900/90 to-slate-950 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Wallet Float
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-cyan-300 mt-3">
            {formatCurrencyBdt(totalMerchantBalances)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Active merchant prepaid deposits
          </p>
        </div>

        {/* Total Merchants */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800/90 bg-gradient-to-b from-slate-900/90 to-slate-950 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Merchants
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-3">{totalTenants}</div>
          <p className="text-[11px] text-slate-400 mt-1">
            <span className="text-indigo-400 font-bold">{activeTenantsCount}</span> stores with orders
          </p>
        </div>

        {/* Total Orders */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800/90 bg-gradient-to-b from-slate-900/90 to-slate-950 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Orders
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-3">{totalOrders}</div>
          <p className="text-[11px] text-slate-400 mt-1">Processed across FB/WhatsApp</p>
        </div>

        {/* AI Bot Invocations */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800/90 bg-gradient-to-b from-slate-900/90 to-slate-950 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              AI Messages
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-300 mt-3">{totalMessages}</div>
          <p className="text-[11px] text-slate-400 mt-1">
            Margin: ৳{config?.perMessageCost ?? 0.25}/msg
          </p>
        </div>
      </div>

      {/* Infrastructure & Gateway Health Status Matrix */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-950 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">
              Central Infrastructure & Gateway Status
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Diagnostic Health Matrix
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Neon PostgreSQL */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <Database className="h-4 w-4 text-emerald-400" />
              <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
            </div>
            <div>
              <div className="text-xs font-bold text-white">PostgreSQL DB</div>
              <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                {dbLatencyMs >= 0 ? `${dbLatencyMs}ms (Online)` : "Disconnected"}
              </div>
            </div>
          </div>

          {/* AI Brain */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <Cpu className="h-4 w-4 text-amber-400" />
              <span className={`flex h-2 w-2 rounded-full ${config?.geminiApiKey || config?.openaiApiKey ? "bg-emerald-400" : "bg-amber-400"}`}></span>
            </div>
            <div>
              <div className="text-xs font-bold text-white">AI Engine</div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                {config?.defaultAiModel === "gemini-1.5-flash" ? "gemini-3.5-flash-lite" : (config?.defaultAiModel || "gemini-3.5-flash-lite")}
              </div>
            </div>
          </div>

          {/* Payment Gateways */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <DollarSign className="h-4 w-4 text-pink-400" />
              <span className={`flex h-2 w-2 rounded-full ${config?.bkashAppKey ? "bg-emerald-400" : "bg-slate-500"}`}></span>
            </div>
            <div>
              <div className="text-xs font-bold text-white">bKash Merchant</div>
              <div className="text-[11px] text-pink-400 font-mono mt-0.5">
                {config?.bkashAppKey ? (config?.bkashSandbox ? "Sandbox Mode" : "Live Merchant") : "Not Configured"}
              </div>
            </div>
          </div>

          {/* SMS Gateways */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <Radio className="h-4 w-4 text-indigo-400" />
              <span className={`flex h-2 w-2 rounded-full ${config?.greenwebToken || config?.bulksmsApiKey ? "bg-emerald-400" : "bg-slate-500"}`}></span>
            </div>
            <div>
              <div className="text-xs font-bold text-white">SMS Gateway</div>
              <div className="text-[11px] text-indigo-400 font-mono mt-0.5">
                {config?.smsProvider || "GREENWEB"}
              </div>
            </div>
          </div>

          {/* Voice & Telephony */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <PhoneCall className="h-4 w-4 text-cyan-400" />
              <span className={`flex h-2 w-2 rounded-full ${config?.twilioAccountSid || config?.sipServer ? "bg-emerald-400" : "bg-slate-500"}`}></span>
            </div>
            <div>
              <div className="text-xs font-bold text-white">Voice & Telephony</div>
              <div className="text-[11px] text-cyan-400 font-mono mt-0.5">
                {config?.voiceProvider || "TWILIO"}
              </div>
            </div>
          </div>

          {/* Cloud Storage */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <Server className="h-4 w-4 text-purple-400" />
              <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
            </div>
            <div>
              <div className="text-xs font-bold text-white">Storage Driver</div>
              <div className="text-[11px] text-purple-400 font-mono mt-0.5">
                {config?.storageProvider || "LOCAL (Disk)"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Activity & Merchants View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Latest Registered Merchants */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800/90 bg-slate-950 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-400" />
                Latest Registered Merchants
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                ১-ক্লিকে যেকোনো মার্চেন্ট অ্যাকাউন্টে ঢুকে সাপোর্ট দেওয়ার সুবিধা।
              </p>
            </div>
            <Link
              href="/admin/tenants"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold inline-flex items-center gap-1"
            >
              View All <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400">
                <tr>
                  <th className="py-2.5">Store</th>
                  <th className="py-2.5 px-3">Wallet</th>
                  <th className="py-2.5 px-3">Orders</th>
                  <th className="py-2.5 px-3 text-right">Impersonate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {latestTenants.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">
                      কোনো মার্চেন্ট পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  latestTenants.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 pr-3">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{t.name}</span>
                          <span className="text-[10px] font-mono text-slate-500 px-1 py-0.2 rounded bg-slate-900 border border-slate-800">
                            {t.slug}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">{t.businessEmail || t.contactPerson || "No email"}</div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                        {formatCurrencyBdt(t.wallet?.balanceBdt || 0)}
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-semibold">
                        {t._count.orders} orders
                      </td>
                      <td className="py-3 pl-3 text-right">
                        <Link
                          href={`/${t.slug}/dashboard`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold text-[11px] transition-colors"
                        >
                          Login As <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 5 Columns: Real-Time Platform Order Stream */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800/90 bg-slate-950 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" />
                Live Platform Orders Feed
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                সারা দেশের বিভিন্ন স্টোরের সাম্প্রতিক অর্ডারসমূহ
              </p>
            </div>
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>

          <div className="space-y-2.5">
            {recentOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                এখনো কোনো অর্ডার তৈরি হয়নি।
              </div>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono">{order.orderNumber}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${getStatusBadge(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {order.tenant.name} • {order.customerName}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-extrabold text-white">
                      {formatCurrencyBdt(order.totalAmount)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {new Date(order.createdAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
