"use client";

import * as React from "react";
import { formatCurrencyBdt } from "@/lib/utils";
import {
  TrendingUp,
  ShoppingBag,
  Bot,
  Layers,
  Facebook,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Truck,
} from "lucide-react";

interface KpiCardsProps {
  todaySales: number;
  todaySalesChangePercent: number;
  ordersToday: number;
  aiAutomationRate: number;
  connectedChannels: {
    facebook: boolean;
    whatsapp: boolean;
    instagram: boolean;
  };
}

export function KpiCards({
  todaySales,
  todaySalesChangePercent,
  ordersToday,
  aiAutomationRate,
  connectedChannels,
}: KpiCardsProps) {
  const isPositiveGrowth = todaySalesChangePercent >= 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 font-body">
      {/* 1. Today Sales Card */}
      <div className="clean-card rounded-2xl p-5 bg-white border border-slate-200 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md font-bengali">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            আজকের বিক্রয়
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
              isPositiveGrowth
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            {isPositiveGrowth ? (
              <ArrowUpRight className="h-3 w-3 text-emerald-600" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-rose-600" />
            )}
            <span>{isPositiveGrowth ? `+${todaySalesChangePercent}%` : `${todaySalesChangePercent}%`}</span>
          </span>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-mono">
            {formatCurrencyBdt(todaySales)}
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>মোট অর্ডারের মূল্য</span>
          <svg className="w-16 h-4" viewBox="0 0 80 20" fill="none">
            <path
              d="M0 16 Q 20 18, 35 10 T 60 12 T 80 4"
              stroke="#10b981"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* 2. Orders Today Card */}
      <div className="clean-card rounded-2xl p-5 bg-white border border-slate-200 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md font-bengali">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            মোট অর্ডার (আজকের)
          </span>
          <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
            <ShoppingBag className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-mono">
            {ordersToday} <span className="text-xs font-normal text-slate-500">টি</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            ১০০% ভেরিফাইড
          </span>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Steadfast / Pathao প্রস্তুত</span>
          <span className="text-slate-700 font-mono font-bold">কুরিয়ার বুকড</span>
        </div>
      </div>

      {/* 3. AI Automation Rate */}
      <div className="clean-card rounded-2xl p-5 bg-white border border-slate-200 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md font-bengali">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            এআই অটোমেশন রেট
          </span>
          <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            <Bot className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div className="text-2xl sm:text-3xl font-black tracking-tight text-indigo-600 font-mono">
            {aiAutomationRate}%
          </div>
          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
            অটোপাইলট সক্রিয়
          </span>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>স্বয়ংক্রিয় এআই চ্যাট ও কল</span>
          <span className="text-emerald-600 font-bold">৯৯.৪% নিখুঁত</span>
        </div>
      </div>

      {/* 4. Connected Channels Status */}
      <div className="clean-card rounded-2xl p-5 bg-white border border-slate-200 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md font-bengali">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            কানেক্টেড চ্যানেলস
          </span>
          <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
            <Zap className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          {/* Messenger */}
          <span
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors ${
              connectedChannels.facebook
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-slate-50 text-slate-400 border-slate-200"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${connectedChannels.facebook ? "bg-blue-600" : "bg-slate-300"}`} />
            FB
          </span>

          {/* WhatsApp */}
          <span
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors ${
              connectedChannels.whatsapp
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-50 text-slate-400 border-slate-200"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${connectedChannels.whatsapp ? "bg-emerald-600" : "bg-slate-300"}`} />
            WA
          </span>

          {/* Instagram */}
          <span
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors ${
              connectedChannels.instagram
                ? "bg-pink-50 text-pink-700 border-pink-200"
                : "bg-slate-50 text-slate-400 border-slate-200"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${connectedChannels.instagram ? "bg-pink-600" : "bg-slate-300"}`} />
            IG
          </span>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>অমনিচ্যানেল ওয়েবহুক</span>
          <span className="text-emerald-600 font-bold">লাইভ সিঙ্ক</span>
        </div>
      </div>
    </div>
  );
}
