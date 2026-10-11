"use client";

import * as React from "react";
import { formatCurrencyBdt, formatDate } from "@/lib/utils";
import { Dialog, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Truck, CheckCircle2 } from "lucide-react";

interface InvoicePrintProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parcel: any;
  tenantName: string;
}

export function InvoicePrint({
  open,
  onOpenChange,
  parcel,
  tenantName,
}: InvoicePrintProps) {
  if (!parcel) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onClose={() => onOpenChange(false)} />
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-indigo-600" />
          কুরিয়ার পার্সেল ইনভয়েস স্লিপ (Print Slip)
        </DialogTitle>
      </DialogHeader>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none;
            padding: 10px;
          }
        }
      `}</style>

      {/* Printable Area */}
      <div id="printable-invoice" className="border border-dashed border-slate-300 rounded-2xl p-6 bg-white dark:bg-slate-900 text-xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              {tenantName}
            </h2>
            <span className="text-[10px] text-slate-400">Official Merchant Delivery Slip</span>
          </div>
          <div className="text-right">
            <span className="font-bold text-xs text-indigo-600">
              {parcel.courierName} Delivery
            </span>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              CID: {parcel.consignmentId || "STF-948201"}
            </div>
          </div>
        </div>

        {/* Mock Barcode */}
        <div className="flex flex-col items-center justify-center py-2 bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
          <div className="h-10 w-48 bg-repeat-x flex items-center justify-center space-x-1 font-mono tracking-widest text-xs font-bold text-slate-900 dark:text-white">
            ||| | |||| | ||||| ||| |||| |
          </div>
          <span className="text-[10px] font-mono text-slate-500 mt-1">
            *{parcel.trackingCode || "TRK-092148102"}*
          </span>
        </div>

        {/* Recipient info */}
        <div className="grid grid-cols-2 gap-4 border-b pb-3">
          <div>
            <span className="font-bold text-slate-400 uppercase text-[9px] block">কাস্টমার তথ্য:</span>
            <strong className="text-slate-900 dark:text-white block mt-0.5">
              {parcel.order?.customerName || "Customer Name"}
            </strong>
            <span className="text-slate-600 block">{parcel.order?.customerPhone || "017XXXXXXXX"}</span>
            <span className="text-slate-500 block text-[11px] mt-1">
              {parcel.order?.deliveryAddress || "Address Details"}
            </span>
          </div>
          <div className="text-right">
            <span className="font-bold text-slate-400 uppercase text-[9px] block">ক্যাশ অন ডেলিভারি (COD):</span>
            <span className="text-lg font-extrabold text-slate-900 dark:text-white block mt-0.5">
              {formatCurrencyBdt(parcel.codAmount || parcel.order?.totalAmount || 0)}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
              কন্ডিশন ক্যাশ কালেকশন
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span>Printed via Mogent AI Platform</span>
          <span>{formatDate(new Date())}</span>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs">
          <Printer className="h-4 w-4 mr-1.5" /> প্রিন্ট করুন (Print Slip)
        </Button>
      </div>
    </Dialog>
  );
}
