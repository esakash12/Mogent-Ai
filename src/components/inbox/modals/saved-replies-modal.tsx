"use client";

import * as React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquareQuote, Plus, Search, Check, Send } from "lucide-react";
import { useToast } from "@/lib/toast-context";

interface SavedReplyItem {
  id: string;
  title: string;
  content: string;
  category?: string | null;
}

interface SavedRepliesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantSlug: string;
  onInsertReply: (content: string) => void;
}

export function SavedRepliesModal({
  open,
  onOpenChange,
  tenantSlug,
  onInsertReply,
}: SavedRepliesModalProps) {
  const { toast } = useToast();
  const [replies, setReplies] = React.useState<SavedReplyItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [showAdd, setShowAdd] = React.useState(false);

  // Add form states
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [category, setCategory] = React.useState("সাধারণ");
  const [saving, setSaving] = React.useState(false);

  const loadReplies = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/saved-replies`);
      if (res.ok) {
        const data = await res.json();
        if (data.replies) setReplies(data.replies);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  React.useEffect(() => {
    if (open) {
      loadReplies();
      setShowAdd(false);
    }
  }, [open, loadReplies]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/saved-replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, category }),
      });

      if (res.ok) {
        toast.success("কুইক রিপ্লাই সেভ হয়েছে!");
        setTitle("");
        setContent("");
        setShowAdd(false);
        loadReplies();
      } else {
        toast.error("সেভ করতে সমস্যা হয়েছে");
      }
    } catch {
      toast.error("সার্ভার সমস্যা, আবার চেষ্টা করুন");
    } finally {
      setSaving(false);
    }
  };

  const filtered = replies.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.content.toLowerCase().includes(search.toLowerCase()) ||
      (r.category && r.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onClose={() => onOpenChange(false)} />
      <DialogHeader>
        <div className="flex items-center justify-between pr-6">
          <DialogTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <MessageSquareQuote className="h-4 w-4 text-emerald-600" />
            কুইক রিপ্লাই (Saved Replies)
          </DialogTitle>
          <Button
            size="sm"
            onClick={() => setShowAdd(!showAdd)}
            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            {showAdd ? "তালিকায় ফিরুন" : "+ নতুন যোগ করুন"}
          </Button>
        </div>
      </DialogHeader>

      {showAdd ? (
        <form onSubmit={handleAddSubmit} className="space-y-3 py-2 text-xs">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              শিরোনাম (Title) *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="উদা: ডেলিভারি সময়সূচী"
              required
              className="h-8 text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              মেসেজের বিবরণ (Content) *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="কাস্টমারকে যে মেসেজটি পাঠাতে চান..."
              required
              rows={3}
              className="w-full rounded-xl border border-border p-2.5 text-xs bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              ক্যাটাগরি
            </label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="ডেলিভারি, পেমেন্ট, অর্ডার..."
              className="h-8 text-xs"
            />
          </div>

          <Button
            type="submit"
            disabled={saving}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 text-xs rounded-xl mt-1"
          >
            {saving ? "সেভ হচ্ছে..." : "কুইক রিপ্লাই সেভ করুন"}
          </Button>
        </form>
      ) : (
        <div className="space-y-3 py-1 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="কুইক রিপ্লাই খুঁজুন..."
              className="pl-8 h-8 text-xs"
            />
          </div>

          {/* List */}
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1 divide-y divide-border/40">
            {loading ? (
              <div className="py-8 text-center text-slate-400">লোড হচ্ছে...</div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-slate-400">কোনো কুইক রিপ্লাই পাওয়া যায়নি</div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  className="pt-2 pb-1 hover:bg-slate-50 dark:hover:bg-slate-900/50 p-2 rounded-xl transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      {item.title}
                    </span>
                    {item.category && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900">
                        {item.category}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {item.content}
                  </p>
                  <div className="flex justify-end pt-1">
                    <Button
                      size="sm"
                      onClick={() => {
                        onInsertReply(item.content);
                        onOpenChange(false);
                      }}
                      className="h-6 text-[10px] bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg gap-1 transition-colors"
                    >
                      <Send className="h-3 w-3" /> চ্যাটে বসান
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}
