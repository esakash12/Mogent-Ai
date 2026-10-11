"use client";

import * as React from "react";
import { formatCurrencyBdt } from "@/lib/utils";

interface SalesPoint {
  day: string;
  sales: number;
  orders: number;
}

interface SalesBarChartProps {
  data: SalesPoint[];
}

export function SalesBarChart({ data }: SalesBarChartProps) {
  const chartData =
    data.length > 0
      ? data
      : [
          { day: "Sat", sales: 2400, orders: 4 },
          { day: "Sun", sales: 4800, orders: 8 },
          { day: "Mon", sales: 3200, orders: 6 },
          { day: "Tue", sales: 6500, orders: 12 },
          { day: "Wed", sales: 8900, orders: 16 },
          { day: "Thu", sales: 5400, orders: 9 },
          { day: "Fri", sales: 11200, orders: 20 },
        ];

  const totalWeekSales = chartData.reduce((acc, curr) => acc + curr.sales, 0);
  const totalWeekOrders = chartData.reduce((acc, curr) => acc + curr.orders, 0);
  const maxSales = Math.max(...chartData.map((d) => d.sales), 5000);

  return (
    <div className="clean-card rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm relative overflow-hidden font-bengali">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm sm:text-base text-slate-900">
              গত ৭ দিনের সেলস ও অর্ডার ভলিউম
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold">
              সাপ্তাহিক
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            মোট সেলস: <span className="font-bold text-slate-900 font-mono">{formatCurrencyBdt(totalWeekSales)}</span> ({totalWeekOrders} টি অর্ডার)
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700">
          <span className="h-2.5 w-2.5 rounded-md bg-indigo-600" />
          <span>বিক্রি (BDT)</span>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="flex h-52 items-end gap-3 pt-6">
        {chartData.map((item, idx) => {
          const heightPercent = maxSales > 0 ? Math.max((item.sales / maxSales) * 100, 6) : 6;
          return (
            <div key={idx} className="flex flex-1 flex-col items-center gap-2 group cursor-pointer">
              <div className="relative w-full flex justify-center h-44 items-end">
                {/* Floating Tooltip */}
                <div className="absolute -top-8 hidden rounded-lg bg-slate-900 text-white px-2.5 py-1 text-[10px] font-bold shadow-lg group-hover:block whitespace-nowrap z-20 pointer-events-none transition-all">
                  <div className="text-emerald-400 font-mono">{formatCurrencyBdt(item.sales)}</div>
                  <div className="text-slate-300 text-[9px] font-mono">{item.orders} orders</div>
                </div>

                {/* Bar */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className="w-full max-w-[36px] rounded-t-lg bg-indigo-600 hover:bg-indigo-500 transition-all duration-200 group-hover:scale-y-105 origin-bottom shadow-2xs"
                />
              </div>

              <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-900 transition-colors">
                {item.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
