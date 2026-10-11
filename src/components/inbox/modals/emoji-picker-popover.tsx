"use client";

import * as React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Smile } from "lucide-react";

interface EmojiPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectEmoji: (emoji: string) => void;
}

const EMOJI_CATEGORIES = [
  {
    name: "জনপ্রিয় ও শুভেচ্ছা",
    emojis: ["😊", "👋", "❤️", "👍", "🙏", "🔥", "✨", "🙌", "😍", "🎉", "💯", "👌"],
  },
  {
    name: "শপিং ও কমার্স",
    emojis: ["🛍️", "📦", "৳", "🚚", "🎁", "🛒", "🏷️", "💳", "💰", "🧾", "⭐", "💎"],
  },
  {
    name: "যোগাযোগ ও কাস্টমার কেয়ার",
    emojis: ["📞", "📍", "⏰", "💬", "📩", "✅", "⚠️", "🔔", "⏳", "🤝", "🚀", "📱"],
  },
  {
    name: "স্মাইলি ও রিঅ্যাকশন",
    emojis: ["😃", "🥰", "😎", "🤩", "🤗", "🥳", "🥺", "😇", "💐", "🌸", "⭐", "🌟"],
  },
];

export function EmojiPickerModal({
  open,
  onOpenChange,
  onSelectEmoji,
}: EmojiPickerModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onClose={() => onOpenChange(false)} />
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <Smile className="h-4 w-4 text-amber-500" />
          ইমোজি পিকার (Emoji Picker)
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-3.5 py-1">
        {EMOJI_CATEGORIES.map((cat) => (
          <div key={cat.name} className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 block">
              {cat.name}
            </span>
            <div className="grid grid-cols-6 gap-2">
              {cat.emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onSelectEmoji(emoji);
                    onOpenChange(false);
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-125 active:scale-95"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Dialog>
  );
}
