"use client";

import * as React from "react";
import { formatCurrencyBdt } from "@/lib/utils";
import { InvoicePrint } from "@/components/parcels/invoice-print";
import { Button } from "@/components/ui/button";
import {
  Truck,
  Printer,
  Search,
  ExternalLink,
  Package,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  MapPin,
  Activity,
  Layers,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ParcelItem {
  id: string;
  consignmentId?: string | null;
  courierName: string;
  trackingCode?: string | null;
  codAmount: number;
  status: string;
  createdAt?: string | Date;
  order?: {
    orderNumber?: string;
    customerName?: string;
    customerPhone?: string;
    deliveryAddress?: string;
    totalAmount?: number;
  } | null;
}

export function ParcelsClient({
  tenantSlug,
  initialParcels,
  tenantName,
}: {
  tenantSlug: string;
  initialParcels: ParcelItem[];
  tenantName: string;
}) {
  const [parcels, setParcels] = React.useState<ParcelItem[]>(initialParcels);
  const [selectedParcel, setSelectedParcel] = React.useState<ParcelItem | null>(null);
  const [printOpen, setPrintOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [courierFilter, setCourierFilter] = React.useState("ALL");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Metrics
  const totalParcels = parcels.length;
  const inTransitCount = parcels.filter(
    (p) => p.status === "IN_TRANSIT" || p.status === "PROCESSING" || p.status === "PENDING"
  ).length;
  const deliveredCount = parcels.filter((p) => p.status === "DELIVERED" || p.status === "COMPLETED").length;
  const totalCodAmount = parcels.reduce((sum, p) => sum + (p.codAmount || 0), 0);
  const deliveryRate = totalParcels > 0 ? Math.round((deliveredCount / totalParcels) * 100) : 100;

  // Filtered parcels
  const filtered = parcels.filter((parcel) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !searchQuery ||
      parcel.consignmentId?.toLowerCase().includes(q) ||
      parcel.trackingCode?.toLowerCase().includes(q) ||
      parcel.order?.customerName?.toLowerCase().includes(q) ||
      parcel.order?.customerPhone?.toLowerCase().includes(q) ||
      parcel.courierName.toLowerCase().includes(q);

    const matchCourier = courierFilter === "ALL" || parcel.courierName.toUpperCase() === courierFilter;
    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "DELIVERED" && (parcel.status === "DELIVERED" || parcel.status === "COMPLETED")) ||
      (statusFilter === "IN_TRANSIT" && (parcel.status === "IN_TRANSIT" || parcel.status === "PROCESSING")) ||
      (statusFilter === "PENDING" && parcel.status === "PENDING");

    return matchSearch && matchCourier && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl dark:border-slate-800">
        <div className="absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-32 top-0 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/15 px-3 py-1 text-[11px] font-semibold text-indigo-200 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span>Automated Logistics Gateway Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Logistics & Courier Delivery
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-normal leading-relaxed">
              Steadfast ও Pathao কুরিয়ারে ১-ক্লিকে কনসাইনমেন্ট বুকিং, বারকোড ইনভয়েস প্রিন্ট এবং লাইভ ডেলিভারি ট্র্যাকিং।
            </p>
          </div>

          {/* Courier Gateway Status Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-700/60 bg-slate-800/80 px-3.5 py-2 backdrop-blur-md">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">
                S
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">Steadfast</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </div>
                <span className="text-[10px] text-slate-400">1-Click Booking Live</span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-slate-700/60 bg-slate-800/80 px-3.5 py-2 backdrop-blur-md">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/30">
                P
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">Pathao</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </div>
                <span className="text-[10px] text-slate-400">Express Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Delivery Pipeline Flow Visualizer (Interactive SVG) */}
        <div className="relative mt-6 pt-6 border-t border-slate-800/80">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                step: "01",
                title: "অর্ডার কনফার্ম",
                subtitle: "AI চ্যাটবট দ্বারা বুকিং",
                icon: Package,
                color: "text-blue-400",
                bg: "bg-blue-500/10 border-blue-500/20",
                active: true,
              },
              {
                step: "02",
                title: "কুরিয়ার হ্যান্ডওভার",
                subtitle: "অটো কনসাইনমেন্ট ID",
                icon: Layers,
                color: "text-indigo-400",
                bg: "bg-indigo-500/10 border-indigo-500/20",
                active: true,
              },
              {
                step: "03",
                title: "অন ট্রানজিট হাইওয়ে",
                subtitle: "লাইভ জিপিএস ট্র্যাকিং",
                icon: Truck,
                color: "text-amber-400",
                bg: "bg-amber-500/10 border-amber-500/20",
                active: inTransitCount > 0,
              },
              {
                step: "04",
                title: "সফল ডেলিভারি ও COD",
                subtitle: "ক্যাশ অন ডেলিভারি সেটেল",
                icon: CheckCircle2,
                color: "text-emerald-400",
                bg: "bg-emerald-500/10 border-emerald-500/20",
                active: deliveredCount > 0,
              },
            ].map((node, i) => {
              const NodeIcon = node.icon;
              return (
                <div
                  key={node.step}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-3 transition-all",
                    node.active ? node.bg : "border-slate-800 bg-slate-900/40 opacity-60"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold border",
                      node.active ? "bg-white/10 border-white/20 " + node.color : "bg-slate-800 text-slate-500 border-slate-700"
                    )}
                  >
                    <NodeIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-400">{node.step}</span>
                      <h4 className="text-xs font-bold text-white truncate">{node.title}</h4>
                    </div>
                    <p className="text-[10px] text-slate-300 truncate">{node.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Key Operational Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Booked */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">মোট পার্সেল</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{totalParcels}</div>
          <p className="text-[11px] text-slate-400 mt-1">সব কুরিয়ার মিলিয়ে বুকিং</p>
        </div>

        {/* In Transit */}
        <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">অন ট্রানজিট</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">{inTransitCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">কাস্টমারের ঠিকানায় পৌঁছাচ্ছে</p>
        </div>

        {/* Delivered Rate */}
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">ডেলিভারি সাকসেস</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{deliveryRate}%</span>
            <span className="text-[11px] text-slate-400">({deliveredCount}টি সফল)</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${deliveryRate}%` }}
            />
          </div>
        </div>

        {/* COD Collected */}
        <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">মোট COD সংগ্রহ</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {formatCurrencyBdt(totalCodAmount)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">ক্যাশ অন ডেলিভারি মোট মূল্য</p>
        </div>
      </div>

      {/* 3. Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/80 pb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Consignment ID, Tracking, Customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1 rounded-xl border border-border bg-slate-50 dark:bg-slate-900 p-1 text-xs">
            {["ALL", "IN_TRANSIT", "DELIVERED", "PENDING"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all",
                  statusFilter === st
                    ? "bg-white text-slate-900 shadow-2xs font-bold dark:bg-slate-800 dark:text-white"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                )}
              >
                {st === "ALL" ? "All Status" : st === "IN_TRANSIT" ? "In Transit" : st === "DELIVERED" ? "Delivered" : "Pending"}
              </button>
            ))}
          </div>

          {/* Courier Filter */}
          <select
            value={courierFilter}
            onChange={(e) => setCourierFilter(e.target.value)}
            className="rounded-xl border border-border bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Couriers</option>
            <option value="STEADFAST">Steadfast Courier</option>
            <option value="PATHAO">Pathao Express</option>
            <option value="REDX">RedX Logistics</option>
          </select>
        </div>
      </div>

      {/* 4. Table Container */}
      <div className="rounded-2xl border border-border bg-white shadow-xs dark:bg-slate-950 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-400 mb-3 border border-indigo-100 dark:border-indigo-900">
              <Truck className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              কোনো পার্সেল বা কনসাইনমেন্ট পাওয়া যায়নি
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              অর্ডার পেজ থেকে যেকোনো অর্ডারের পাশে থাকা ১-ক্লিক কুরিয়ার বুকিং দিলে অটো পার্সেল তৈরি হয়ে এখানে ট্র্যাক হবে।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/80 bg-slate-50/75 dark:bg-slate-900/50 text-[11px] font-bold uppercase text-slate-400">
                <tr>
                  <th className="py-3.5 pl-4 pr-2">Consignment ID</th>
                  <th className="py-3.5 px-3">Courier Gateway</th>
                  <th className="py-3.5 px-3">Customer & Destination</th>
                  <th className="py-3.5 px-3">Tracking Code</th>
                  <th className="py-3.5 px-3">COD Amount</th>
                  <th className="py-3.5 px-3">Live Status</th>
                  <th className="py-3.5 px-3 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((parcel) => {
                  const isDelivered = parcel.status === "DELIVERED" || parcel.status === "COMPLETED";
                  const isTransit = parcel.status === "IN_TRANSIT" || parcel.status === "PROCESSING";

                  return (
                    <tr
                      key={parcel.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-900/60 transition-colors"
                    >
                      {/* Consignment ID */}
                      <td className="py-3.5 pl-4 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-white font-mono">
                            {parcel.consignmentId || "CID-82910"}
                          </span>
                          <button
                            onClick={() =>
                              handleCopy(
                                parcel.id + "-cid",
                                parcel.consignmentId || "CID-82910"
                              )
                            }
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            title="Copy Consignment ID"
                          >
                            {copiedId === parcel.id + "-cid" ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                        {parcel.order?.orderNumber && (
                          <span className="text-[10px] text-slate-400 block font-mono">
                            Order: #{parcel.order.orderNumber}
                          </span>
                        )}
                      </td>

                      {/* Courier Gateway */}
                      <td className="py-3.5 px-3">
                        <div className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold">
                          {parcel.courierName.toUpperCase().includes("STEADFAST") ? (
                            <>
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />
                              <span className="text-emerald-700 dark:text-emerald-300">Steadfast</span>
                            </>
                          ) : (
                            <>
                              <span className="h-2 w-2 rounded-full bg-rose-500" />
                              <span className="text-rose-700 dark:text-rose-300">Pathao</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Customer & Address */}
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-200">
                          {parcel.order?.customerName || "Customer Name"}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <span>{parcel.order?.customerPhone || "017XXXXXXXX"}</span>
                          {parcel.order?.deliveryAddress && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[140px] text-slate-400">
                                {parcel.order.deliveryAddress}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Tracking Code */}
                      <td className="py-3.5 px-3">
                        {parcel.trackingCode ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                              {parcel.trackingCode}
                            </span>
                            <button
                              onClick={() =>
                                handleCopy(
                                  parcel.id + "-trk",
                                  parcel.trackingCode || ""
                                )
                              }
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                              title="Copy Tracking Code"
                            >
                              {copiedId === parcel.id + "-trk" ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Generating...</span>
                        )}
                      </td>

                      {/* COD Amount */}
                      <td className="py-3.5 px-3 font-extrabold text-slate-900 dark:text-white font-mono">
                        {formatCurrencyBdt(parcel.codAmount)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                            isDelivered &&
                              "bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300",
                            isTransit &&
                              "bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300",
                            !isDelivered &&
                              !isTransit &&
                              "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300"
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              isDelivered && "bg-emerald-500",
                              isTransit && "bg-amber-500 animate-pulse",
                              !isDelivered && !isTransit && "bg-slate-400"
                            )}
                          />
                          {parcel.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-3 text-right pr-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedParcel(parcel);
                              setPrintOpen(true);
                            }}
                            className="h-7 text-xs rounded-xl border-border hover:bg-slate-100 dark:hover:bg-slate-800 gap-1 font-semibold"
                          >
                            <Printer className="h-3.5 w-3.5 text-slate-500" /> Print Slip
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Print Modal */}
      {selectedParcel && (
        <InvoicePrint
          open={printOpen}
          onOpenChange={setPrintOpen}
          parcel={selectedParcel}
          tenantName={tenantName}
        />
      )}
    </div>
  );
}
