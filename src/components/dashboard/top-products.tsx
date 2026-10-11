"use client";

import * as React from "react";
import { formatCurrencyBdt } from "@/lib/utils";
import { ShoppingBag, Plus, ArrowUpRight, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface ProductItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string | null;
  category?: string | null;
}

interface TopProductsProps {
  products: ProductItem[];
  tenantSlug: string;
}

export function TopProducts({ products, tenantSlug }: TopProductsProps) {
  return (
    <div className="clean-card rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm relative overflow-hidden flex flex-col justify-between h-full font-bengali">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900">
              সর্বাধিক বিক্রিত পণ্যসমূহ
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">টপ পারফর্মিং প্রোডাক্ট ক্যাটালগ</p>
          </div>
          <Link
            href={`/${tenantSlug}/sales/products`}
            className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <span>সব দেখুন</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {products.length === 0 ? (
          // Clean Empty State
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 border border-slate-200">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <h4 className="mt-3 text-xs font-bold text-slate-800">
              কোনো পণ্য পাওয়া যায়নি
            </h4>
            <p className="mt-1 text-[11px] text-slate-500 max-w-[210px] leading-relaxed">
              আপনার পণ্য যোগ করুন যেন এআই স্বয়ংক্রিয়ভাবে স্টক যাচাই করে কাস্টমারদের অর্ডার নিতে পারে।
            </p>
            <Link
              href={`/${tenantSlug}/sales/products`}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 text-xs font-bold shadow-xs transition-all"
            >
              <Plus className="h-3.5 w-3.5" /> পণ্য যোগ করুন
            </Link>
          </div>
        ) : (
          <div className="mt-2 divide-y divide-slate-100">
            {products.slice(0, 5).map((product) => {
              const isLowStock = product.stock <= 5 && product.stock > 0;
              const isOutOfStock = product.stock === 0;

              return (
                <div
                  key={product.id}
                  className="flex items-center justify-between py-3 group hover:bg-slate-50/70 -mx-2 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 overflow-hidden font-bold text-xs border border-slate-200 shrink-0">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        product.name.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 truncate">
                        {product.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.2 text-[9px] font-bold border ${
                            isOutOfStock
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : isLowStock
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {isOutOfStock ? (
                            <span>স্টক শেষ</span>
                          ) : (
                            <>
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              <span>{product.stock} টি ইন-স্টক</span>
                            </>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium truncate">
                          {product.category || "General"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 font-mono">
                      {formatCurrencyBdt(product.price)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {products.length > 0 && (
        <div className="pt-4 border-t border-slate-100">
          <Link
            href={`/${tenantSlug}/sales/products`}
            className="w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>নতুন পণ্য ক্যাটালগে যুক্ত করুন</span>
          </Link>
        </div>
      )}
    </div>
  );
}
