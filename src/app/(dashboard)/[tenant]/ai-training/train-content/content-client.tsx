"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import {
  Layers,
  FileText,
  Globe,
  Save,
  CheckCircle2,
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  Sparkles,
  Tag,
  Truck,
  CreditCard,
  Ruler,
  Store,
  Gift,
  HelpCircle,
} from "lucide-react";
import { useToast } from "@/lib/toast-context";

export interface AgentMemoryItem {
  id: string;
  category: string;
  title: string;
  content: string;
  tags: string[];
  source: string;
  isActive: boolean;
  updatedAt: string;
}

const CATEGORIES: { [key: string]: { label: string; icon: any; color: string } } = {
  POLICY: { label: "ডেলিভারি ও কুরিয়ার", icon: Truck, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40" },
  PRODUCT_INFO: { label: "সাইজ ও ফেব্রিক তথ্য", icon: Ruler, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/40" },
  PAYMENT: { label: "পেমেন্ট ও বিকাশ", icon: CreditCard, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" },
  DISCOUNT_OFFER: { label: "অফার ও ছাড়", icon: Gift, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40" },
  STORE_INFO: { label: "শোরুম ও সময়সূচি", icon: Store, color: "text-sky-600 bg-sky-50 dark:bg-sky-950/40" },
  CUSTOM_RULE: { label: "কাস্টম রুলস", icon: HelpCircle, color: "text-slate-600 bg-slate-100 dark:bg-slate-800" },
};

export function TrainContentClient({
  tenantSlug,
  initialKnowledgeBase,
  initialMemories = [],
}: {
  tenantSlug: string;
  initialKnowledgeBase: string;
  initialMemories?: AgentMemoryItem[];
}) {
  const { toast } = useToast();
  const [content, setContent] = React.useState(initialKnowledgeBase || "");
  const [websiteUrl, setWebsiteUrl] = React.useState("");
  const [saved, setSaved] = React.useState(false);
  const [isScraping, setIsScraping] = React.useState(false);

  // Living Notebook states
  const [memories, setMemories] = React.useState<AgentMemoryItem[]>(initialMemories);
  const [activeCategoryFilter, setActiveCategoryFilter] = React.useState<string>("ALL");
  const [noteModalOpen, setNoteModalOpen] = React.useState(false);
  const [editingNote, setEditingNote] = React.useState<AgentMemoryItem | null>(null);

  // Note form fields
  const [noteTitle, setNoteTitle] = React.useState("");
  const [noteCategory, setNoteCategory] = React.useState("CUSTOM_RULE");
  const [noteContent, setNoteContent] = React.useState("");
  const [noteTags, setNoteTags] = React.useState("");
  const [isSubmittingNote, setIsSubmittingNote] = React.useState(false);

  const handleOpenAddModal = () => {
    setEditingNote(null);
    setNoteTitle("");
    setNoteCategory("CUSTOM_RULE");
    setNoteContent("");
    setNoteTags("");
    setNoteModalOpen(true);
  };

  const handleOpenEditModal = (note: AgentMemoryItem) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteCategory(note.category);
    setNoteContent(note.content);
    setNoteTags(note.tags ? note.tags.join(", ") : "");
    setNoteModalOpen(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;

    setIsSubmittingNote(true);
    const tagsArray = noteTags
      .split(/[,،]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      if (editingNote) {
        // PUT update
        const res = await fetch(`/api/tenants/${tenantSlug}/agent-notebook`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingNote.id,
            title: noteTitle.trim(),
            category: noteCategory,
            content: noteContent.trim(),
            tags: tagsArray,
          }),
        });

        const data = await res.json();
        if (res.ok && data.entry) {
          setMemories((prev) =>
            prev.map((m) => (m.id === editingNote.id ? data.entry : m))
          );
          toast.success("নোটটি সফলভাবে আপডেট হয়েছে!");
          setNoteModalOpen(false);
        } else {
          toast.error(data.error || "আপডেট ব্যর্থ হয়েছে");
        }
      } else {
        // POST create
        const res = await fetch(`/api/tenants/${tenantSlug}/agent-notebook`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: noteTitle.trim(),
            category: noteCategory,
            content: noteContent.trim(),
            tags: tagsArray,
          }),
        });

        const data = await res.json();
        if (res.ok && data.entry) {
          setMemories((prev) => [data.entry, ...prev]);
          toast.success("নতুন নোট সফলভাবে যুক্ত হয়েছে!");
          setNoteModalOpen(false);
        } else {
          toast.error(data.error || "সংরক্ষণ ব্যর্থ হয়েছে");
        }
      }
    } catch (err: any) {
      console.error("Save note error:", err);
      toast.error("সার্ভার সমস্যা, আবার চেষ্টা করুন");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই নোটটি মুছে ফেলতে চান?")) return;

    setMemories((prev) => prev.filter((m) => m.id !== id));
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/agent-notebook?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("নোটটি মুছে ফেলা হয়েছে");
      }
    } catch (err) {
      console.error("Delete note error:", err);
      toast.error("মুছতে সমস্যা হয়েছে");
    }
  };

  const handleSaveFaq = async () => {
    try {
      await fetch(`/api/tenants/${tenantSlug}/train-content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ knowledgeBaseText: content }),
      });
      setSaved(true);
      toast.success("নলেজ বেস টেক্সট সংরক্ষিত হয়েছে!");
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Save error:", err);
      toast.error("সংরক্ষণ ব্যর্থ হয়েছে");
    }
  };

  const handleImportUrl = async () => {
    if (!websiteUrl) return;
    setIsScraping(true);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/train-content`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: websiteUrl }),
      });
      const data = await res.json();
      if (res.ok && data.snippet) {
        setContent((prev) => (prev ? `${prev}\n\n${data.snippet}` : data.snippet));
        setWebsiteUrl("");
        toast.success("ওয়েবসাইট ডাটা সফলভাবে যুক্ত হয়েছে!");
      }
    } catch (err) {
      console.error("Failed to import URL:", err);
      toast.error("ওয়েবসাইট থেকে ডাটা আনতে সমস্যা হয়েছে");
    } finally {
      setIsScraping(false);
    }
  };

  const filteredMemories = memories.filter((m) =>
    activeCategoryFilter === "ALL" ? true : m.category === activeCategoryFilter
  );

  return (
    <div className="max-w-5xl space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-indigo-600" />
            Store Living Notebook & Knowledge Base
          </h1>
          <p className="text-xs text-slate-400">
            এআই এজেন্টের স্বাধীন মেমোরি নোটবুক। সাধারণ বাংলায় আপনার দোকানের নিয়ম ও তথ্য যুক্ত করুন, কোনো ফিক্সড ডাটাবেজ কলামের লিমিটেশন নেই।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleOpenAddModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer gap-1.5"
          >
            <Plus className="h-4 w-4" /> নতুন নোট যোগ করুন
          </Button>
        </div>
      </div>

      {/* 2. Living Notebook Section */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-xs dark:bg-slate-950 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              এজেন্টের সক্রিয় নোটবুক ({memories.length})
            </h2>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveCategoryFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                activeCategoryFilter === "ALL"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              সবগুলো ({memories.length})
            </button>
            {Object.entries(CATEGORIES).map(([catKey, catInfo]) => {
              const count = memories.filter((m) => m.category === catKey).length;
              return (
                <button
                  key={catKey}
                  onClick={() => setActiveCategoryFilter(catKey)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
                    activeCategoryFilter === catKey
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {catInfo.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Notebook Cards Grid */}
        {filteredMemories.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs space-y-2">
            <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">
              {activeCategoryFilter === "ALL"
                ? "এখনো কোনো স্টোর নোট যুক্ত করা হয়নি।"
                : "এই ক্যাটাগরিতে কোনো নোট পাওয়া যায়নি।"}
            </p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              সাইজ চার্ট, আউটলেট সময়, কুরিয়ার বা বিশেষ পলিসি যুক্ত করতে উপরের বাটনে চাপ দিন।
            </p>
            <Button
              size="sm"
              onClick={handleOpenAddModal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-xl mt-2"
            >
              + প্রথম নোট যোগ করুন
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredMemories.map((note) => {
              const catMeta = CATEGORIES[note.category] || CATEGORIES.CUSTOM_RULE;
              const CatIcon = catMeta.icon;
              return (
                <div
                  key={note.id}
                  className="rounded-xl border border-border bg-slate-50/50 dark:bg-slate-900/50 p-4 space-y-2 hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${catMeta.color}`}
                      >
                        <CatIcon className="h-3 w-3" />
                        {catMeta.label}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(note)}
                          className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="সম্পাদনা করুন"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                      {note.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>

                  {note.tags && note.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap pt-2 border-t border-border/40">
                      {note.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] bg-white dark:bg-slate-800 text-slate-500 font-mono px-1.5 py-0.5 rounded border border-border"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Website Importer Box */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-xs dark:bg-slate-950 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Globe className="h-4 w-4 text-indigo-600" />
          ওয়েবসাইট বা ক্যাটালগ লিংক থেকে তথ্য ইমপোর্ট করুন
        </h3>
        <p className="text-xs text-slate-400">
          আপনার ই-কমার্স ওয়েবসাইট বা ফেসবুক ক্যাটালগের লিংক দিন, AI স্বয়ংক্রিয়ভাবে সেখান থেকে তথ্য পড়ে নেবে।
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="https://dorita.pages.dev/ বা আপনার ওয়েবসাইটের URL"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            className="text-xs flex-1"
          />
          <Button
            onClick={handleImportUrl}
            disabled={isScraping || !websiteUrl}
            variant="outline"
            className="text-xs font-bold rounded-xl"
          >
            {isScraping ? "ইমপোর্ট হচ্ছে..." : "Import Data"}
          </Button>
        </div>
      </div>

      {/* 4. Legacy Custom Knowledge Base Editor */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-xs dark:bg-slate-950 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-600" />
            সাধারণ FAQ ও রুলবুক টেক্সট (Quick FAQ)
          </h3>
          <Button
            size="sm"
            onClick={handleSaveFaq}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl"
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            {saved ? "সংরক্ষিত!" : "Save FAQ"}
          </Button>
        </div>
        <textarea
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="এখানে আপনার ব্যবসার বিশেষ নিয়মাবলী, বা সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQ) লিখে রাখুন..."
          className="w-full rounded-xl border border-input bg-slate-50 dark:bg-slate-900 p-4 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
        />
      </div>

      {/* Add / Edit Note Dialog Modal */}
      <Dialog open={noteModalOpen} onOpenChange={setNoteModalOpen}>
        <DialogClose onClose={() => setNoteModalOpen(false)} />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            {editingNote ? "স্টোর নোট সম্পাদনা করুন" : "নতুন স্টোর নোট যোগ করুন"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSaveNote} className="space-y-3.5 py-2 text-xs">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              নোটের শিরোনাম *
            </label>
            <Input
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="উদা: ৩-৫ বছরের সাইজ চার্ট / ধানমন্ডি শোরুম / বিকাশ ক্যাশআউট পলিসি"
              required
              className="text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              ক্যাটাগরি *
            </label>
            <select
              value={noteCategory}
              onChange={(e) => setNoteCategory(e.target.value)}
              className="w-full rounded-xl border border-input bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {Object.entries(CATEGORIES).map(([k, meta]) => (
                <option key={k} value={k}>
                  {meta.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              বিস্তারিত বিবরণ ও নিয়মাবলী *
            </label>
            <textarea
              rows={5}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="সাধারণ বাংলায় পরিষ্কারভাবে নিয়মটি লিখুন। যেমন: '৩ বছর পর্যন্ত বাচ্চার সাইজ ২৮, ৪-৫ বছর সাইজ ৩০। ধোয়ার পর কোনো কালার উঠবে না।'"
              required
              className="w-full rounded-xl border border-input bg-slate-50 dark:bg-slate-900 p-3 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              ট্যাগ বা কিওয়ার্ড (কমা দিয়ে লিখুন)
            </label>
            <Input
              value={noteTags}
              onChange={(e) => setNoteTags(e.target.value)}
              placeholder="উদা: সাইজ, বয়স, মেজারমেন্ট, বাচ্চা"
              className="text-xs"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              কাস্টমার চ্যাটে এই কিওয়ার্ডগুলো বললে এআই দ্রুত নোটবুক থেকে তথ্য খুঁজে নেবে।
            </span>
          </div>

          <Button
            type="submit"
            disabled={isSubmittingNote}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-md mt-2 cursor-pointer text-xs"
          >
            {isSubmittingNote
              ? "সংরক্ষণ হচ্ছে..."
              : editingNote
              ? "নোট আপডেট করুন"
              : "নোটবুক-এ সেভ করুন"}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
