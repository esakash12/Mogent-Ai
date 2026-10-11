"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { formatCurrencyBdt } from "@/lib/utils";
import {
  Users,
  Search,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  PlusCircle,
  MinusCircle,
  AlertTriangle,
  CheckCircle2,
  Filter,
  X,
  Loader2,
  Building2,
  DollarSign,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TenantData {
  id: string;
  name: string;
  slug: string;
  contactPerson: string | null;
  businessEmail: string | null;
  phone: string | null;
  createdAt: string;
  wallet: {
    id: string;
    balanceBdt: number;
  } | null;
  _count: {
    orders: number;
    products: number;
    channels: number;
  };
}

export function TenantsClient({ initialTenants }: { initialTenants: TenantData[] }) {
  const [tenants, setTenants] = useState<TenantData[]>(initialTenants);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"ALL" | "LOW_BALANCE" | "ACTIVE">("ALL");

  // Modal State
  const [selectedTenant, setSelectedTenant] = useState<TenantData | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustType, setAdjustType] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [adjustNote, setAdjustNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Filtered tenants calculation
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        (t.businessEmail && t.businessEmail.toLowerCase().includes(q)) ||
        (t.contactPerson && t.contactPerson.toLowerCase().includes(q)) ||
        (t.phone && t.phone.includes(q));

      if (!matchesSearch) return false;

      const balance = t.wallet?.balanceBdt || 0;
      if (filterTab === "LOW_BALANCE") {
        return balance < 100;
      }
      if (filterTab === "ACTIVE") {
        return t._count.orders > 0;
      }
      return true;
    });
  }, [tenants, searchQuery, filterTab]);

  // Aggregate stats
  const totalBalance = tenants.reduce((acc, t) => acc + (t.wallet?.balanceBdt || 0), 0);
  const lowBalanceCount = tenants.filter((t) => (t.wallet?.balanceBdt || 0) < 100).length;
  const activeStoresCount = tenants.filter((t) => t._count.orders > 0).length;

  const handleOpenAdjustModal = (tenant: TenantData) => {
    setSelectedTenant(tenant);
    setAdjustAmount("");
    setAdjustType("CREDIT");
    setAdjustNote("");
  };

  const handleCloseModal = () => {
    if (submitting) return;
    setSelectedTenant(null);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;

    const amountNum = parseFloat(adjustAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setToastMsg({ text: "অনুগ্রহ করে একটি সঠিক টাকার পরিমাণ লিখুন।", type: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/tenants/adjust-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: selectedTenant.id,
          amount: amountNum,
          type: adjustType,
          description: adjustNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ব্যালেন্স পরিবর্তন করতে ব্যর্থ হয়েছে।");
      }

      // Update local tenant state
      setTenants((prev) =>
        prev.map((t) =>
          t.id === selectedTenant.id
            ? {
                ...t,
                wallet: {
                  id: t.wallet?.id || "temp-id",
                  balanceBdt: data.balanceBdt,
                },
              }
            : t
        )
      );

      setToastMsg({ text: data.message, type: "success" });
      setTimeout(() => setToastMsg(null), 4000);
      setSelectedTenant(null);
    } catch (err: any) {
      setToastMsg({ text: err.message || "সার্ভার এরর হয়েছে।", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Banner */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-3 ${
            toastMsg.type === "success"
              ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/40"
              : "bg-rose-950/90 text-rose-200 border-rose-500/40"
          }`}
        >
          {toastMsg.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Users className="h-7 w-7 text-indigo-400" />
            Registered Merchants Directory
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            প্ল্যাটফর্মের সমস্ত মার্চেন্ট অ্যাকাউন্ট পর্যবেক্ষণ, সরাসরি ওয়ালেট ক্রেডিট/টপ-আপ এবং ১-ক্লিকে মার্চেন্ট ড্যাশবোর্ডে লগইন।
          </p>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800/90 bg-slate-950 p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Stores
          </span>
          <div className="text-xl font-black text-white mt-1">{tenants.length}</div>
          <span className="text-[10px] text-slate-500">Registered on Mogent</span>
        </div>

        <div className="rounded-2xl border border-slate-800/90 bg-slate-950 p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Float Balance
          </span>
          <div className="text-xl font-black text-emerald-400 mt-1">
            {formatCurrencyBdt(totalBalance)}
          </div>
          <span className="text-[10px] text-slate-500">Prepaid across all wallets</span>
        </div>

        <div className="rounded-2xl border border-slate-800/90 bg-slate-950 p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Active Stores
          </span>
          <div className="text-xl font-black text-indigo-400 mt-1">{activeStoresCount}</div>
          <span className="text-[10px] text-slate-500">Stores with orders</span>
        </div>

        <div className="rounded-2xl border border-slate-800/90 bg-slate-950 p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Low Balance Warnings
          </span>
          <div className="text-xl font-black text-amber-400 mt-1">{lowBalanceCount}</div>
          <span className="text-[10px] text-slate-500">Balance &lt; ৳100</span>
        </div>
      </div>

      {/* Controls: Search & Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="মার্চেন্টের নাম, ইমেইল বা slug খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterTab("ALL")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors shrink-0 ${
              filterTab === "ALL"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All Stores ({tenants.length})
          </button>
          <button
            onClick={() => setFilterTab("LOW_BALANCE")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors shrink-0 ${
              filterTab === "LOW_BALANCE"
                ? "bg-amber-600/30 text-amber-300 border border-amber-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Low Balance ({lowBalanceCount})
          </button>
          <button
            onClick={() => setFilterTab("ACTIVE")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors shrink-0 ${
              filterTab === "ACTIVE"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Active ({activeStoresCount})
          </button>
        </div>
      </div>

      {/* Merchants Table */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-950 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/50 text-[11px] font-bold uppercase text-slate-400">
              <tr>
                <th className="py-3.5 pl-4 pr-3">Store Name & Slug</th>
                <th className="py-3.5 px-3">Owner Contact</th>
                <th className="py-3.5 px-3">Wallet Balance</th>
                <th className="py-3.5 px-3">Orders</th>
                <th className="py-3.5 px-3">Channels</th>
                <th className="py-3.5 px-3 text-right pr-4">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    কোনো মার্চেন্ট অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => {
                  const balance = t.wallet?.balanceBdt || 0;
                  const isCritical = balance < 50;
                  const isLow = balance < 200 && !isCritical;

                  return (
                    <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                      {/* Store Details */}
                      <td className="py-3.5 pl-4 pr-3">
                        <div className="font-bold text-white flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                          <span>{t.name}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                            /{t.slug}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Joined {new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-3">
                        <span className="text-white block font-medium">
                          {t.contactPerson || "Merchant Owner"}
                        </span>
                        <span className="text-slate-400 text-[11px] block">{t.businessEmail || "No email"}</span>
                        {t.phone && <span className="text-slate-500 text-[10px] font-mono">{t.phone}</span>}
                      </td>

                      {/* Wallet Balance with Health Badge */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-extrabold text-sm ${
                              isCritical ? "text-rose-400" : isLow ? "text-amber-400" : "text-emerald-400"
                            }`}
                          >
                            {formatCurrencyBdt(balance)}
                          </span>
                          {isCritical && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Critical
                            </span>
                          )}
                          {isLow && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Low
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Metrics */}
                      <td className="py-3.5 px-3 font-semibold text-slate-300">
                        {t._count.orders} orders
                      </td>

                      <td className="py-3.5 px-3 font-semibold text-slate-300">
                        {t._count.channels} connected
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right pr-4">
                        <div className="inline-flex items-center gap-2">
                          {/* Credit / Balance Button */}
                          <button
                            onClick={() => handleOpenAdjustModal(t)}
                            title="Adjust or Top-up Wallet Balance"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 text-xs font-bold transition-colors"
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            <span>Credit</span>
                          </button>

                          {/* 1-Click Login As */}
                          <Link
                            href={`/${t.slug}/dashboard`}
                            target="_blank"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-xs"
                          >
                            <span>Login As</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Wallet Balance Adjustment Modal */}
      {selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-indigo-400" />
                  Adjust Merchant Wallet
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Store: <span className="text-white font-semibold">{selectedTenant.name}</span> (/{selectedTenant.slug})
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={submitting}
                className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              {/* Current Balance Display */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex items-center justify-between">
                <span className="text-slate-400">Current Wallet Balance</span>
                <span className="text-sm font-black font-mono text-emerald-400">
                  {formatCurrencyBdt(selectedTenant.wallet?.balanceBdt || 0)}
                </span>
              </div>

              {/* Adjustment Type Selector */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType("CREDIT")}
                    className={`flex items-center justify-center gap-2 py-2 rounded-xl font-bold border transition-colors ${
                      adjustType === "CREDIT"
                        ? "bg-emerald-600/20 text-emerald-300 border-emerald-500/50"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    <PlusCircle className="h-4 w-4 text-emerald-400" /> Credit (Top-up)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType("DEBIT")}
                    className={`flex items-center justify-center gap-2 py-2 rounded-xl font-bold border transition-colors ${
                      adjustType === "DEBIT"
                        ? "bg-rose-600/20 text-rose-300 border-rose-500/50"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    <MinusCircle className="h-4 w-4 text-rose-400" /> Debit (Correction)
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block">Amount (৳ BDT)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    ৳
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="500.00"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-8 pr-4 py-2.5 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Admin Note / Description */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block">Transaction Note / TrxID (Audit Trail)</label>
                <input
                  type="text"
                  placeholder="যেমন: bKash Cash Received TrxID: 9X82KD or Onboarding Gift"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      Confirm {adjustType === "CREDIT" ? "Credit" : "Debit"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
