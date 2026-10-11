"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  Sparkles,
  Wand2,
  Copy,
  Check,
  Loader2,
  ShoppingBag,
  BookmarkPlus,
  Flame,
  Layers,
  Hash,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/lib/toast-context";

interface ProductOption {
  id: string;
  name: string;
  price: number;
}

export default function CreativeStudioPage() {
  const { toast } = useToast();
  const params = useParams();
  const tenantSlug = params?.tenant as string;

  const [products, setProducts] = React.useState<ProductOption[]>([]);
  const [selectedProductId, setSelectedProductId] = React.useState<string>("");
  const [productTopic, setProductTopic] = React.useState("প্রিমিয়াম ব্লুটুথ স্মার্টওয়াচ");
  const [tone, setTone] = React.useState("অফার ও ডিসকাউন্ট (High-Converting Promo)");
  const [targetAudience, setTargetAudience] = React.useState("সাধারণ অনলাইন ক্রেতা");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Generated Result
  const [generatedData, setGeneratedData] = React.useState<{
    variationA?: string;
    variationB?: string;
    headlines?: string[];
    hashtags?: string;
  } | null>(null);

  const [activeTab, setActiveTab] = React.useState<"varA" | "varB" | "headlines">("varA");
  const [copied, setCopied] = React.useState(false);
  const [savingSavedReply, setSavingSavedReply] = React.useState(false);

  // Load store products
  React.useEffect(() => {
    if (!tenantSlug) return;
    const fetchProducts = async () => {
      try {
        const res = await fetch(`/api/tenants/${tenantSlug}/products`);
        if (res.ok) {
          const data = await res.json();
          if (data.products && Array.isArray(data.products)) {
            setProducts(data.products);
          }
        }
      } catch {
        // Silently ignore
      }
    };
    fetchProducts();
  }, [tenantSlug]);

  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    if (!prodId) return;
    const found = products.find((p) => p.id === prodId);
    if (found) {
      setProductTopic(`${found.name} (মূল্য: ৳${found.price})`);
    }
  };

  const handleGenerate = async () => {
    if (!productTopic.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/creative-studio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productTopic,
          tone,
          targetAudience,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setGeneratedData(json.data);
        setActiveTab("varA");
        toast.success("বিজ্ঞাপন কপি তৈরি সম্পন্ন হয়েছে!");
      } else {
        setError(json.error || "বিজ্ঞাপন কপি জেনারেট করতে সমস্যা হয়েছে।");
      }
    } catch {
      setError("সার্ভারে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const currentCopyText =
    activeTab === "varA"
      ? generatedData?.variationA || ""
      : activeTab === "varB"
      ? generatedData?.variationB || ""
      : (generatedData?.headlines || []).join("\n\n");

  const handleCopy = () => {
    if (!currentCopyText) return;
    navigator.clipboard.writeText(currentCopyText);
    setCopied(true);
    toast.success("ক্লিপবোর্ডে কপি হয়েছে!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToSavedReply = async () => {
    if (!currentCopyText) return;
    setSavingSavedReply(true);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/saved-replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `অ্যাড কপি: ${productTopic.slice(0, 25)}`,
          content: currentCopyText,
          category: "মার্কেটিং",
        }),
      });
      if (res.ok) {
        toast.success("ইনবক্সের সেভড রিপ্লাই তালিকায় যুক্ত করা হয়েছে!");
      } else {
        toast.error("সেভ করতে সমস্যা হয়েছে");
      }
    } catch {
      toast.error("সার্ভার সমস্যা");
    } finally {
      setSavingSavedReply(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-indigo-600" />
          Creative Studio (AI Ad Copywriting)
        </h1>
        <p className="text-xs text-slate-400">
          গুগল জেমিনি এআই দিয়ে ফেসবুক ও ইনস্টাগ্রামের জন্য কনভার্টিং বাংলা বিজ্ঞাপন কপি, ক্যাপশন ও অফার তৈরি করুন।
        </p>
      </div>

      {/* Generator Configuration Form */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-xs dark:bg-slate-950 space-y-4 text-xs">
        {/* Product Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              স্টোরের ক্যাটালগ থেকে নির্বাচন করুন
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductSelect(e.target.value)}
              className="w-full h-9 rounded-xl border border-input bg-slate-50/50 dark:bg-slate-900 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">-- ক্যাটালগ থেকে বেছে নিন (ঐচ্ছিক) --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - ৳{p.price}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              পণ্যের নাম বা বিবরণ *
            </label>
            <Input
              value={productTopic}
              onChange={(e) => {
                setProductTopic(e.target.value);
                setSelectedProductId("");
              }}
              placeholder="উদা: Smart Watch Pro / প্রিমিয়াম পাঞ্জাবি"
              className="h-9 text-xs"
              required
            />
          </div>
        </div>

        {/* Tone and Audience Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              বিজ্ঞাপনের টোন ও স্টাইল
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full h-9 rounded-xl border border-input bg-slate-50/50 dark:bg-slate-900 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="অফার ও ডিসকাউন্ট (High-Converting Promo)">অফার ও ডিসকাউন্ট (High-Converting Promo)</option>
              <option value="প্রিমিয়াম ও আকর্ষণীয় (Luxury & Brand Appeal)">প্রিমিয়াম ও আকর্ষণীয় (Luxury & Brand Appeal)</option>
              <option value="সমস্যা ও সমাধান (Problem-Solution Hook)">সমস্যা ও সমাধান (Problem-Solution Hook)</option>
              <option value="সংক্ষিপ্ত ও টু-দ্য-পয়েন্ট (Short & Punchy)">সংক্ষিপ্ত ও টু-দ্য-পয়েন্ট (Short & Punchy)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              টার্গেট অডিয়েন্স
            </label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full h-9 rounded-xl border border-input bg-slate-50/50 dark:bg-slate-900 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="সাধারণ অনলাইন ক্রেতা">সাধারণ অনলাইন ক্রেতা</option>
              <option value="তরুণ-তরুণী ও গ্যাজেট লাভার (Gen Z / Youth)">তরুণ-তরুণী ও গ্যাজেট লাভার (Gen Z / Youth)</option>
              <option value="গৃহিণী ও পরিবার (Families / Homemakers)">গৃহিণী ও পরিবার (Families / Homemakers)</option>
              <option value="কর্মজীবী পুরুষ ও নারী (Professionals)">কর্মজীবী পুরুষ ও নারী (Professionals)</option>
            </select>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading || !productTopic.trim()}
          className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-md cursor-pointer gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> AI বিজ্ঞাপন কপি তৈরি করছে...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" /> AI বিজ্ঞাপন কপি জেনারেট করুন
            </>
          )}
        </Button>

        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
      </div>

      {/* Generated Result Container */}
      {generatedData && (
        <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm dark:bg-slate-950 dark:border-indigo-900 space-y-4 text-xs">
          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-border/80 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("varA")}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  activeTab === "varA"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                ভ্যারিয়েশন A (হুক ও সমাধান)
              </button>
              <button
                onClick={() => setActiveTab("varB")}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  activeTab === "varB"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                ভ্যারিয়েশন B (অফার ও ডিসকাউন্ট)
              </button>
              <button
                onClick={() => setActiveTab("headlines")}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  activeTab === "headlines"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                হেডলাইন ও হ্যাশট্যাগ
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveToSavedReply}
                disabled={savingSavedReply}
                className="h-8 text-xs font-semibold gap-1.5 rounded-xl"
              >
                <BookmarkPlus className="h-3.5 w-3.5 text-indigo-600" />
                {savingSavedReply ? "সেভ হচ্ছে..." : "ইনবক্স রিপ্লাইয়ে সেভ করুন"}
              </Button>
              <Button
                size="sm"
                onClick={handleCopy}
                className="h-8 text-xs font-bold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "কপি হয়েছে!" : "কপি করুন"}
              </Button>
            </div>
          </div>

          {/* Copy Preview Box */}
          <div className="p-4 rounded-xl bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 leading-relaxed font-sans whitespace-pre-line text-slate-800 dark:text-slate-200 text-[13px]">
            {activeTab === "headlines" ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-2">
                    ফেসবুক বিজ্ঞাপনের আকর্ষণীয় হেডলাইন আইডিয়া:
                  </h4>
                  <ul className="space-y-1.5 list-disc pl-5">
                    {generatedData.headlines?.map((h, i) => (
                      <li key={i} className="font-medium">
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
                {generatedData.hashtags && (
                  <div>
                    <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-1">
                      #️⃣ প্রস্তাবিত হ্যাশট্যাগ:
                    </h4>
                    <p className="text-indigo-600 font-mono text-xs">{generatedData.hashtags}</p>
                  </div>
                )}
              </div>
            ) : (
              currentCopyText
            )}
          </div>
        </div>
      )}
    </div>
  );
}
