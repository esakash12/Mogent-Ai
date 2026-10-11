"use client";

import * as React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import {
  Image,
  Smile,
  ShoppingBag,
  MessageSquareQuote,
  Camera,
  Mic,
  UserPlus,
  Tag,
  FileCheck,
} from "lucide-react";

interface ActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAction: (actionType: string) => void;
}

export function ActionModal({
  open,
  onOpenChange,
  onSelectAction,
}: ActionModalProps) {
  const actions = [
    { id: "gallery", label: "Gallery", icon: Image, color: "text-blue-500 bg-blue-50" },
    { id: "emoji", label: "Emoji", icon: Smile, color: "text-amber-500 bg-amber-50" },
    { id: "products", label: "Products", icon: ShoppingBag, color: "text-indigo-500 bg-indigo-50" },
    { id: "saved_reply", label: "Saved Reply", icon: MessageSquareQuote, color: "text-emerald-500 bg-emerald-50" },
    { id: "camera", label: "Camera", icon: Camera, color: "text-purple-500 bg-purple-50" },
    { id: "audio", label: "Audio", icon: Mic, color: "text-rose-500 bg-rose-50" },
    { id: "assign", label: "Assign", icon: UserPlus, color: "text-cyan-500 bg-cyan-50" },
    { id: "tag", label: "Tag", icon: Tag, color: "text-violet-500 bg-violet-50" },
    { id: "order_create", label: "Order create", icon: FileCheck, color: "text-orange-500 bg-orange-50" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onClose={() => onOpenChange(false)} />
      <DialogHeader>
        <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
          Add to your reply
        </DialogTitle>
      </DialogHeader>

      <div className="grid grid-cols-3 gap-3 py-2">
        {actions.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectAction(item.id);
                onOpenChange(false);
              }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl border border-border/80 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 group"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.color} transition-transform group-hover:scale-110 mb-2`}>
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </Dialog>
  );
}
