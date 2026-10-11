"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FileSpreadsheet, Plus, Trash2, CheckCircle2, Save } from "lucide-react";

interface FieldItem {
  id: string;
  label: string;
  questionText: string;
  required: boolean;
}

export function OrderFieldsClient({
  tenantSlug,
  initialFields,
}: {
  tenantSlug: string;
  initialFields: FieldItem[];
}) {
  const [fields, setFields] = React.useState<FieldItem[]>(
    initialFields.length > 0
      ? initialFields
      : [
          { id: "1", label: "কাস্টমার নাম", questionText: "আপনার পুরো নামটি বলবেন প্লিজ?", required: true },
          { id: "2", label: "মোবাইল নম্বর", questionText: "আপনার সক্রিয় মোবাইল নম্বরটি দিন:", required: true },
          { id: "3", label: "ডেলিভারি ঠিকানা", questionText: "ডেলিভারির সম্পূর্ণ ঠিকানা (জেলাসহ) প্রদান করুন:", required: true },
          { id: "4", label: "সাইজ / কালার", questionText: "আপনার পছন্দের সাইজ বা কালার কোনটি?", required: false },
        ]
  );
  const [saved, setSaved] = React.useState(false);

  const handleAddField = () => {
    const newField: FieldItem = {
      id: Date.now().toString(),
      label: "নতুন ফিল্ড",
      questionText: "কাস্টমারকে কী প্রশ্ন জিজ্ঞেস করবেন?",
      required: false,
    };
    setFields([...fields, newField]);
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const handleSave = async () => {
    try {
      await fetch(`/api/tenants/${tenantSlug}/order-fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Order Fields Configuration
          </h1>
          <p className="text-xs text-slate-400">
            চ্যাটে অর্ডার কনফার্ম করার সময় AI কাস্টমারকে কী কী প্রশ্ন করবে তা কাস্টমাইজ করুন।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleAddField}
            variant="outline"
            className="text-xs font-bold rounded-xl"
          >
            <Plus className="h-4 w-4 mr-1" /> প্রশ্ন যোগ করুন
          </Button>
          <Button
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
          >
            <Save className="h-4 w-4 mr-1.5" />
            {saved ? "সংরক্ষিত হয়েছে!" : "পরিবর্তন সেভ করুন"}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white p-6 shadow-xs dark:bg-slate-950 space-y-4">
        {fields.map((field, idx) => (
          <div
            key={field.id}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl border border-border/70 bg-slate-50/50 dark:bg-slate-900/40"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
              {idx + 1}
            </span>

            <div className="w-full sm:w-48">
              <label className="text-[10px] font-bold text-slate-400 uppercase">ফিল্ডের নাম</label>
              <Input
                value={field.label}
                onChange={(e) => {
                  const val = e.target.value;
                  setFields(fields.map((f) => (f.id === field.id ? { ...f, label: val } : f)));
                }}
                className="text-xs h-8 bg-white dark:bg-slate-900"
              />
            </div>

            <div className="flex-1 w-full">
              <label className="text-[10px] font-bold text-slate-400 uppercase">বটের প্রশ্ন (বাংলায়)</label>
              <Input
                value={field.questionText}
                onChange={(e) => {
                  const val = e.target.value;
                  setFields(fields.map((f) => (f.id === field.id ? { ...f, questionText: val } : f)));
                }}
                className="text-xs h-8 bg-white dark:bg-slate-900"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0 pt-3 sm:pt-0">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {field.required ? "বাধ্যতামূলক" : "ঐচ্ছিক"}
              </span>
              <Switch
                checked={field.required}
                onCheckedChange={(checked) => {
                  setFields(fields.map((f) => (f.id === field.id ? { ...f, required: checked } : f)));
                }}
              />
              <button
                onClick={() => handleRemoveField(field.id)}
                className="p-1 text-slate-400 hover:text-rose-500 transition-colors ml-2"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
