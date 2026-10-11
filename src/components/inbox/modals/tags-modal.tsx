"use client";

import * as React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag as TagIcon, Check, Plus } from "lucide-react";
import { useToast } from "@/lib/toast-context";

interface TagsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantSlug: string;
  conversationId: string;
  currentTags?: string | null;
  onUpdateTags: (tags: string) => void;
}

const AVAILABLE_TAGS = [
  { name: "VIP", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { name: "Hot Lead", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { name: "Urgent", color: "bg-rose-100 text-rose-700 border-rose-200" },
  { name: "Pending Payment", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { name: "Wholesale", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { name: "Follow-up", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
];

export function TagsModal({
  open,
  onOpenChange,
  tenantSlug,
  conversationId,
  currentTags,
  onUpdateTags,
}: TagsModalProps) {
  const { toast } = useToast();
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [customTag, setCustomTag] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      if (currentTags) {
        setSelectedTags(
          currentTags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        );
      } else {
        setSelectedTags([]);
      }
    }
  }, [open, currentTags]);

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    );
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTag.trim()) return;
    const clean = customTag.trim();
    if (!selectedTags.includes(clean)) {
      setSelectedTags((prev) => [...prev, clean]);
    }
    setCustomTag("");
  };

  const handleSave = async () => {
    setSaving(true);
    const tagsStr = selectedTags.join(",");
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: tagsStr }),
      });

      if (res.ok) {
        toast.success("ট্যাগগুলো সফলভাবে আপডেট হয়েছে!");
        onUpdateTags(tagsStr);
        onOpenChange(false);
      } else {
        toast.error("ট্যাগ আপডেট করতে সমস্যা হয়েছে");
      }
    } catch {
      toast.error("সার্ভার সমস্যা, আবার চেষ্টা করুন");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onClose={() => onOpenChange(false)} />
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <TagIcon className="h-4 w-4 text-violet-500" />
          ট্যাগ ম্যানেজমেন্ট (Conversation Tags)
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4 py-2 text-xs">
        <p className="text-slate-500">
          এই চ্যাটটি সহজে ফিল্টার ও ট্র্যাক করতে প্রয়োজনীয় ট্যাগ সিলেক্ট করুন:
        </p>

        {/* Available Tags Grid */}
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_TAGS.map((t) => {
            const isChecked = selectedTags.includes(t.name);
            return (
              <button
                key={t.name}
                type="button"
                onClick={() => toggleTag(t.name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                  isChecked
                    ? `${t.color} ring-2 ring-violet-500 scale-105 shadow-xs`
                    : "border-border/80 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
                }`}
              >
                {isChecked && <Check className="h-3.5 w-3.5" />}
                <span>#{t.name}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Tag Input */}
        <form onSubmit={handleAddCustom} className="flex gap-2 pt-1">
          <Input
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            placeholder="কাস্টম ট্যাগ লিখুন..."
            className="h-8 text-xs"
          />
          <Button
            type="submit"
            size="sm"
            variant="outline"
            className="h-8 text-xs shrink-0 gap-1 border-violet-200 text-violet-600 hover:bg-violet-50"
          >
            <Plus className="h-3 w-3" /> যোগ করুন
          </Button>
        </form>

        {/* Action Button */}
        <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs"
          >
            বাতিল
          </Button>
          <Button
            size="sm"
            disabled={saving}
            onClick={handleSave}
            className="h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white font-bold px-4"
          >
            {saving ? "সেভ হচ্ছে..." : "ট্যাগ সেভ করুন"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
