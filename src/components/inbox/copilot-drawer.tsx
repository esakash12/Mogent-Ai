"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { formatCurrencyBdt } from "@/lib/utils";
import {
  User,
  Phone,
  MapPin,
  Bot,
  ShoppingBag,
  Sparkles,
  Receipt,
  FileCheck2,
  Edit2,
  Check,
  Facebook,
  Instagram,
  Package,
  ShieldCheck,
  Truck,
  TrendingUp,
} from "lucide-react";

interface CopilotDrawerProps {
  customerName: string;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  channelType?: string;
  customerExternalId?: string | null;
  aiHandled: boolean;
  totalMessages: number;
  totalAiCostBdt: number;
  recentOrders?: any[];
  onToggleAi: (active: boolean) => void;
  onCreateOrderClick: () => void;
  onUpdateCustomer?: (name: string, phone: string) => void;
}

export function CopilotDrawer({
  customerName,
  customerPhone,
  deliveryAddress,
  channelType = "FACEBOOK",
  customerExternalId,
  aiHandled,
  totalMessages,
  totalAiCostBdt,
  recentOrders = [],
  onToggleAi,
  onCreateOrderClick,
  onUpdateCustomer,
}: CopilotDrawerProps) {
  const [reviewMode, setReviewMode] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editName, setEditName] = React.useState(customerName);
  const [editPhone, setEditPhone] = React.useState(customerPhone || "");

  React.useEffect(() => {
    setEditName(customerName);
    setEditPhone(customerPhone || "");
  }, [customerName, customerPhone]);

  const handleSaveCustomer = () => {
    if (onUpdateCustomer) {
      onUpdateCustomer(editName, editPhone);
    }
    setIsEditing(false);
  };

  return (
    <aside className="flex h-full w-80 flex-col border-l border-slate-200 bg-white p-5 overflow-y-auto font-body select-none">
      {/* Customer Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 font-bengali">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-base shadow-xs shrink-0">
            {customerName ? customerName.charAt(0).toUpperCase() : "C"}
          </div>
          <div className="min-w-0 pr-2">
            <h3 className="font-bold text-sm text-slate-900 truncate">
              {customerName}
            </h3>
            <span className="text-[11px] text-slate-500 font-mono truncate block">
              {customerPhone || "ফোন নম্বর এখনো মেলেনি"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
          title="কাস্টমার তথ্য এডিট করুন"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="mt-3 p-3 rounded-xl border border-indigo-200 bg-indigo-50/60 space-y-2 text-xs font-bengali animate-in fade-in">
          <div>
            <label className="text-[10px] font-bold text-slate-700 block mb-1">নাম</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-700 block mb-1">ফোন নম্বর</label>
            <input
              type="text"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="017xxxxxxxx"
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-600"
            />
          </div>
          <button
            type="button"
            onClick={handleSaveCustomer}
            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors"
          >
            সংরক্ষণ করুন
          </button>
        </div>
      )}

      {/* Fraud Risk & Verified Badge */}
      <div className="mt-4 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between text-xs font-bengali">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold text-emerald-800">ফ্রড রিস্ক: কম (Verified)</span>
        </div>
        <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
          SAFE
        </span>
      </div>

      {/* AI Copilot & Auto-Pilot Switch */}
      <div className="mt-4 space-y-3 font-bengali">
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2.5">
            <Bot className="h-4 w-4 text-indigo-600" />
            <div>
              <span className="text-xs font-bold text-slate-900 block">AI অটোপাইলট</span>
              <span className="text-[10px] text-slate-500">এই চ্যাটে স্বয়ংক্রিয় রিপ্লাই</span>
            </div>
          </div>
          <Switch checked={aiHandled} onCheckedChange={onToggleAi} />
        </div>

        {/* Create Order CTA */}
        <button
          type="button"
          onClick={onCreateOrderClick}
          className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>নতুন অর্ডার তৈরি করুন</span>
        </button>
      </div>

      {/* Customer Telemetry */}
      <div className="mt-5 pt-4 border-t border-slate-100 space-y-3 font-bengali text-xs">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          কাস্টমার টেলিমেট্রি
        </div>

        <div className="flex items-center justify-between text-slate-600">
          <span>মোট আদান-প্রদান:</span>
          <span className="font-bold text-slate-900 font-mono">{totalMessages} টি বার্তা</span>
        </div>

        <div className="flex items-center justify-between text-slate-600">
          <span>এআই খরচ:</span>
          <span className="font-bold text-indigo-600 font-mono">{formatCurrencyBdt(totalAiCostBdt)}</span>
        </div>

        <div className="flex items-center justify-between text-slate-600">
          <span>চ্যানেল সোর্স:</span>
          <span className="font-bold text-slate-800">{channelType}</span>
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="mt-5 pt-4 border-t border-slate-100 font-bengali text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            অর্ডার ইতিহাস
          </span>
          <span className="text-[10px] text-slate-400">{recentOrders.length} টি</span>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-400 text-xs">
            পূর্বে কোনো অর্ডার নেই
          </div>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((ord: any) => (
              <div
                key={ord.id}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-slate-900 block">#{ord.orderNumber}</span>
                  <span className="text-[10px] text-slate-500 font-mono">৳{ord.totalAmount}</span>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {ord.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
