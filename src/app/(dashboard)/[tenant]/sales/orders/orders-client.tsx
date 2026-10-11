"use client";

import * as React from "react";
import { formatCurrencyBdt } from "@/lib/utils";
import { OrderData, OrderStatus } from "@/types/order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/lib/toast-context";
import {
  Package,
  Search,
  Download,
  Plus,
  Truck,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Send,
  Loader2,
  FileText,
  User,
  Phone,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface OrdersClientProps {
  tenantSlug: string;
  initialOrders: OrderData[];
}

export function OrdersClient({
  tenantSlug,
  initialOrders,
}: OrdersClientProps) {
  const { toast } = useToast();
  const [orders, setOrders] = React.useState<OrderData[]>(initialOrders);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [channelFilter, setChannelFilter] = React.useState("ALL");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [dateFilter, setDateFilter] = React.useState("Last 7 days");
  const [addOrderModalOpen, setAddOrderModalOpen] = React.useState(false);

  // Dispatch modal states
  const [dispatchModalOpen, setDispatchModalOpen] = React.useState(false);
  const [selectedOrderForDispatch, setSelectedOrderForDispatch] = React.useState<OrderData | null>(null);
  const [selectedCourier, setSelectedCourier] = React.useState<"STEADFAST" | "PATHAO">("STEADFAST");
  const [isDispatching, setIsDispatching] = React.useState(false);

  // New order form states
  const [customerName, setCustomerName] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [deliveryAddress, setDeliveryAddress] = React.useState("");
  const [productName, setProductName] = React.useState("");
  const [totalAmount, setTotalAmount] = React.useState("");
  const [channel, setChannel] = React.useState("FACEBOOK");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Stats calculation
  const totalOrders = orders.length;
  const totalSalesBdt = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingCount = orders.filter((o) => o.status === "PENDING").length;
  const completedCount = orders.filter((o) => o.status === "COMPLETED").length;
  const inProgressCount = orders.filter((o) => o.status === "PROCESSING").length;

  const filtered = orders.filter((order) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      order.customerName.toLowerCase().includes(q) ||
      order.customerPhone.includes(q) ||
      order.orderNumber.toLowerCase().includes(q);
    const matchesChannel =
      channelFilter === "ALL" || order.channel.toUpperCase() === channelFilter;
    const matchesStatus =
      statusFilter === "ALL" || order.status.toUpperCase() === statusFilter;
    return matchesSearch && matchesChannel && matchesStatus;
  });

  // Export CSV
  const handleExportCsv = () => {
    const headers = ["Order ID", "Customer", "Phone", "Address", "Total (BDT)", "Status", "Channel", "Date"];
    const rows = filtered.map((o) => [
      o.orderNumber,
      `"${o.customerName}"`,
      o.customerPhone,
      `"${o.deliveryAddress.replace(/"/g, '""')}"`,
      o.totalAmount,
      o.status,
      o.channel,
      new Date(o.createdAt).toLocaleDateString(),
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orders_${tenantSlug}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV ফাইল ডাউনলোড শুরু হয়েছে!");
  };

  // Dispatch courier handler
  const handleDispatchOrder = async () => {
    if (!selectedOrderForDispatch) return;
    setIsDispatching(true);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/parcels/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrderForDispatch.id,
          courier: selectedCourier,
        }),
      });

      if (res.ok) {
        toast.success(`${selectedCourier === "STEADFAST" ? "Steadfast" : "Pathao"} কুরিয়ারে বুকিং সম্পন্ন হয়েছে!`);
        setOrders((prev) =>
          prev.map((o) =>
            o.id === selectedOrderForDispatch.id ? { ...o, status: "PROCESSING" } : o
          )
        );
        setDispatchModalOpen(false);
      } else {
        toast.error("কুরিয়ার বুকিং ব্যর্থ হয়েছে। কুরিয়ার এপিআই কি যাচাই করুন।");
      }
    } catch {
      toast.error("সার্ভার সমস্যা, কিছুক্ষণ পর আবার চেষ্টা করুন");
    } finally {
      setIsDispatching(false);
    }
  };

  // Manual update order status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        toast.success(`অর্ডার স্ট্যাটাস '${newStatus}'-এ আপডেট হয়েছে!`);
      } else {
        toast.error("স্ট্যাটাস আপডেট করতে ব্যর্থ হয়েছে");
      }
    } catch {
      toast.error("সার্ভার ত্রুটি");
    }
  };

  // Create manual order handler
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          deliveryAddress,
          productName,
          totalAmount: parseFloat(totalAmount) || 0,
          channel,
        }),
      });

      if (res.ok) {
        const newOrder = await res.json();
        setOrders((prev) => [newOrder, ...prev]);
        toast.success("নতুন অর্ডার সফলভাবে তৈরি হয়েছে!");
        setAddOrderModalOpen(false);
        setCustomerName("");
        setCustomerPhone("");
        setDeliveryAddress("");
        setProductName("");
        setTotalAmount("");
      } else {
        toast.error("অর্ডার তৈরি ব্যর্থ হয়েছে");
      }
    } catch {
      toast.error("সার্ভার সমস্যা হয়েছে");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-body">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 font-bengali">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              অর্ডার ও কুরিয়ার হাব
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              লাইভ সিঙ্ক
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            মেসেঞ্জার, হোয়াটসঅ্যাপ ও ওয়েবসাইট থেকে আসা সমস্ত অর্ডারের সেন্ট্রাল ডিরেক্টরি
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAddOrderModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> নতুন অর্ডার যোগ করুন
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 font-bengali">
        <div className="clean-card rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500">মোট অর্ডার</span>
          <div className="mt-1 text-2xl font-black text-slate-900 font-mono">{totalOrders}</div>
          <div className="mt-1 text-[10px] text-slate-400">সর্বমোট রেকর্ড</div>
        </div>

        <div className="clean-card rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500">মোট সেলস</span>
          <div className="mt-1 text-2xl font-black text-indigo-600 font-mono">
            {formatCurrencyBdt(totalSalesBdt)}
          </div>
          <div className="mt-1 text-[10px] text-emerald-600 font-bold">রেভিনিউ ভলিউম</div>
        </div>

        <div className="clean-card rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500">পেন্ডিং অর্ডার</span>
          <div className="mt-1 text-2xl font-black text-amber-600 font-mono">{pendingCount}</div>
          <div className="mt-1 text-[10px] text-amber-600 font-bold">কনফার্মেশন দরকার</div>
        </div>

        <div className="clean-card rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500">ইন প্রসেসিং</span>
          <div className="mt-1 text-2xl font-black text-blue-600 font-mono">{inProgressCount}</div>
          <div className="mt-1 text-[10px] text-blue-600 font-bold">কুরিয়ারে পাঠানো</div>
        </div>

        <div className="clean-card rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500">কমপ্লিট</span>
          <div className="mt-1 text-2xl font-black text-emerald-600 font-mono">{completedCount}</div>
          <div className="mt-1 text-[10px] text-emerald-600 font-bold">সফলভাবে ডেলিভার্ড</div>
        </div>
      </div>

      {/* 3. Sub Nav, Date Filter & Export */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 font-bengali">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2">
          <span className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs">
            অর্ডার তালিকা
          </span>
          <Link
            href={`/${tenantSlug}/sales/orders/fields`}
            className="rounded-xl px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            অর্ডার ফিল্ড কাস্টমাইজেশন
          </Link>
          <Link
            href={`/${tenantSlug}/sales/parcels`}
            className="rounded-xl px-3.5 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1"
          >
            <Truck className="h-3.5 w-3.5" /> কুরিয়ার হাব ও স্লিপ
          </Link>
        </div>

        {/* Date Filters & Export */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-indigo-600" />
            CSV এক্সপোর্ট ({filtered.length})
          </button>
        </div>
      </div>

      {/* 4. Table Container */}
      <div className="clean-card rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden font-bengali">
        {/* Table Filters Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-slate-100 gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="কাস্টমার নাম, ফোন বা অর্ডার # খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs">
              {["ALL", "FACEBOOK", "WHATSAPP"].map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChannelFilter(ch)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 font-bold text-[11px] transition-colors cursor-pointer",
                    channelFilter === ch
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  {ch === "ALL" ? "সব চ্যানেল" : ch === "FACEBOOK" ? "মেসেঞ্জার" : "হোয়াটসঅ্যাপ"}
                </button>
              ))}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700"
            >
              <option value="ALL">সব স্ট্যাটাস</option>
              <option value="PENDING">Pending (পেন্ডিং)</option>
              <option value="PROCESSING">Processing (প্রসেসিং)</option>
              <option value="COMPLETED">Completed (সম্পন্ন)</option>
              <option value="CANCELLED">Cancelled (বাতিল)</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 mb-3 border border-slate-200">
              <Package className="h-6 w-6" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">
              কোনো অর্ডার পাওয়া যায়নি
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
              কাস্টমার চ্যাটে অর্ডার দিলে বা ম্যানুয়ালি অর্ডার যোগ করলে এখানে রিয়েলটাইমে দেখতে পাবেন।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="py-3.5 pl-4 pr-2">Order #</th>
                  <th className="py-3.5 px-3">গ্রাহক</th>
                  <th className="py-3.5 px-3">পণ্য</th>
                  <th className="py-3.5 px-3">চ্যানেল</th>
                  <th className="py-3.5 px-3">মোট মূল্য</th>
                  <th className="py-3.5 px-3">স্ট্যাটাস</th>
                  <th className="py-3.5 px-3 text-right pr-4">কুরিয়ার ডিসপ্যাচ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((order) => {
                  const isPending = order.status === "PENDING";
                  const isProcessing = order.status === "PROCESSING";
                  const isCompleted = order.status === "COMPLETED";

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 pl-4 pr-2">
                        <span className="font-bold text-slate-900 font-mono">
                          {order.orderNumber}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900">
                          {order.customerName}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <span>{order.customerPhone}</span>
                          {order.deliveryAddress && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[120px] text-slate-400">
                                {order.deliveryAddress}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-medium text-slate-800">
                          {order.items && order.items.length > 0
                            ? order.items[0].productName
                            : "General Item"}
                        </div>
                        {order.items && order.items.length > 1 && (
                          <span className="text-[10px] text-slate-400 font-semibold">
                            +{order.items.length - 1} more items
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        {order.channel === "WHATSAPP" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            WhatsApp
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            Messenger
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 font-bold text-slate-900 font-mono">
                        {formatCurrencyBdt(order.totalAmount)}
                      </td>

                      <td className="py-3.5 px-3">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                          className={cn(
                            "cursor-pointer text-[11px] font-bold rounded-full px-2.5 py-1 border transition-colors outline-none focus:ring-1",
                            isPending && "bg-amber-50 text-amber-800 border-amber-200 focus:ring-amber-400",
                            isProcessing && "bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-400",
                            isCompleted && "bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-400",
                            order.status === "CANCELLED" && "bg-rose-50 text-rose-700 border-rose-200 focus:ring-rose-400"
                          )}
                        >
                          <option value="PENDING" className="bg-white text-slate-800">PENDING</option>
                          <option value="PROCESSING" className="bg-white text-slate-800">PROCESSING</option>
                          <option value="COMPLETED" className="bg-white text-slate-800">COMPLETED</option>
                          <option value="CANCELLED" className="bg-white text-slate-800">CANCELLED</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-3 text-right pr-4">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrderForDispatch(order);
                            setDispatchModalOpen(true);
                          }}
                          className={cn(
                            "h-7 px-3 text-xs rounded-xl font-bold gap-1 shadow-2xs transition-all inline-flex items-center cursor-pointer",
                            isProcessing
                              ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white"
                          )}
                        >
                          <Truck className="h-3.5 w-3.5" />
                          <span>{isProcessing ? "কুরিয়ারে পাঠানো হয়েছে" : "কুরিয়ার বুকিং"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Courier 1-Click Dispatch Modal */}
      <Dialog open={dispatchModalOpen} onOpenChange={setDispatchModalOpen} className="font-bengali">
        <DialogClose onClose={() => setDispatchModalOpen(false)} />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-indigo-600" />
            ১-ক্লিক কুরিয়ার পার্সেল বুকিং (Courier Dispatch)
          </DialogTitle>
        </DialogHeader>

        {selectedOrderForDispatch && (
          <div className="space-y-4 py-2 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 font-mono">
                  Order #{selectedOrderForDispatch.orderNumber}
                </span>
                <span className="font-bold text-indigo-600 font-mono">
                  {formatCurrencyBdt(selectedOrderForDispatch.totalAmount)} COD
                </span>
              </div>
              <div className="text-slate-600">
                <div className="font-bold text-slate-800">
                  {selectedOrderForDispatch.customerName} ({selectedOrderForDispatch.customerPhone})
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {selectedOrderForDispatch.deliveryAddress}
                </div>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-2">
                কুরিয়ার সার্ভিস বেছে নিন:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedCourier("STEADFAST")}
                  className={cn(
                    "flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all cursor-pointer",
                    selectedCourier === "STEADFAST"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold shadow-2xs"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold text-xs mb-1">
                    S
                  </div>
                  <span className="font-bold text-xs">Steadfast Courier</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">অটো পিকআপ রিকোয়েস্ট</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCourier("PATHAO")}
                  className={cn(
                    "flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all cursor-pointer",
                    selectedCourier === "PATHAO"
                      ? "border-rose-500 bg-rose-50 text-rose-900 font-bold shadow-2xs"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-700 font-bold text-xs mb-1">
                    P
                  </div>
                  <span className="font-bold text-xs">Pathao Express</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">ফাস্ট সিটি ডেলিভারি</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDispatchOrder}
              disabled={isDispatching}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-xs mt-3 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isDispatching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> কুরিয়ারে বুকিং হচ্ছে...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> কুরিয়ারে নিশ্চিত বুকিং পাঠান
                </>
              )}
            </button>
          </div>
        )}
      </Dialog>

      {/* 6. Manual Add Order Modal */}
      <Dialog open={addOrderModalOpen} onOpenChange={setAddOrderModalOpen} className="font-bengali">
        <DialogClose onClose={() => setAddOrderModalOpen(false)} />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-indigo-600" />
            ম্যানুয়াল নতুন অর্ডার যোগ করুন
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCreateOrder} className="space-y-3.5 py-2 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">কাস্টমার নাম</label>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="কাস্টমারের নাম"
              required
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">ফোন নম্বর</label>
            <input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              required
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">ডেলিভারি ঠিকানা</label>
            <input
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="ঠিকানা ও জেলা"
              required
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">পণ্যের নাম</label>
              <input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="যেমন: জামদানি শাড়ি"
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">মোট মূল্য (BDT)</label>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="1999"
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-xs mt-2 transition-colors cursor-pointer"
          >
            {isSubmitting ? "সংরক্ষণ হচ্ছে..." : "অর্ডার সেভ করুন"}
          </button>
        </form>
      </Dialog>
    </div>
  );
}
