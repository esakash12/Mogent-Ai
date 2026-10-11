"use client";

import * as React from "react";
import { formatCurrencyBdt } from "@/lib/utils";
import { Dialog, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import {
  ShoppingBag,
  Plus,
  Search,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Layers,
  Sparkles,
  Edit,
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  category?: string | null;
  imageUrl?: string | null;
  source: string;
  createdAt: string | Date;
}

interface ProductsClientProps {
  tenantSlug: string;
  initialProducts: ProductItem[];
}

export function ProductsClient({
  tenantSlug,
  initialProducts,
}: ProductsClientProps) {
  const [products, setProducts] = React.useState<ProductItem[]>(initialProducts);
  const [activeTab, setActiveTab] = React.useState<"products" | "combos">("products");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form states
  const [name, setName] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [stock, setStock] = React.useState("5");
  const [category, setCategory] = React.useState("Gadget");
  const [imageUrl, setImageUrl] = React.useState("");
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/tenants/${tenantSlug}/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          setImageUrl(data.url);
        }
      }
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          price: parseFloat(price),
          stock: parseInt(stock),
          category,
          imageUrl: imageUrl || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setProducts([data.product, ...products]);
        setAddModalOpen(false);
        setName("");
        setPrice("");
        setStock("5");
        setImageUrl("");
      }
    } catch (err) {
      console.error("Failed to add product:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStock = async (id: string, newStock: number) => {
    if (newStock < 0) return;
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock: newStock } : p))
    );
  };

  return (
    <div className="space-y-6 font-body font-bengali">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              প্রোডাক্ট ও সফট-লক স্টক ম্যানেজার
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
              Soft-Lock Enabled
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            চ্যাট ও কলের মাধ্যমে কাস্টমার অর্ডার বুক করার সাথে সাথে স্টক সফট-লক হয়ে যায়
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="h-4 w-4" /> নতুন পণ্য যোগ করুন
        </button>
      </div>

      {/* 2. Products List Container */}
      <div className="clean-card rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="পণ্য খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-bold">
              মোট {filtered.length} টি পণ্য
            </span>
          </div>
        </div>

        {/* List View */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <ShoppingBag className="h-10 w-10 text-slate-300 mb-2" />
            <h4 className="text-xs font-bold text-slate-700">
              কোনো প্রোডাক্ট পাওয়া যায়নি
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
              আপনার প্রথম প্রোডাক্ট যোগ করতে উপরের "+ নতুন পণ্য যোগ করুন" বাটনে ক্লিক করুন।
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 overflow-hidden font-bold text-sm border border-slate-200 shrink-0">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      item.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {item.category || "General"}
                      </span>
                      <span>•</span>
                      <span className="text-[11px]">
                        সোর্স: <strong className="text-slate-700">{item.source}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stock Controls & Price */}
                <div className="flex items-center gap-6">
                  {/* Stock Counter */}
                  <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleUpdateStock(item.id, item.stock - 1)}
                      className="h-6 w-6 rounded-lg bg-white text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold text-xs border border-slate-200 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold text-slate-800 px-1 font-mono">
                      {item.stock} স্টক
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateStock(item.id, item.stock + 1)}
                      className="h-6 w-6 rounded-lg bg-white text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold text-xs border border-slate-200 cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {/* Price */}
                  <div className="text-right min-w-[80px]">
                    <span className="font-bold text-sm text-slate-900 font-mono">
                      {formatCurrencyBdt(item.price)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen} className="font-bengali">
        <DialogClose onClose={() => setAddModalOpen(false)} />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-indigo-600" />
            নতুন প্রোডাক্ট যুক্ত করুন (Add Product)
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleAddProduct} className="space-y-3.5 py-2 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">পণ্যের নাম</label>
            <input
              placeholder="যেমন: Galaxy Gadget, Jamdani Saree"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">মূল্য (BDT)</label>
              <input
                type="number"
                placeholder="1999"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">প্রাথমিক স্টক</label>
              <input
                type="number"
                placeholder="5"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">ক্যাটাগরি</label>
            <input
              placeholder="Gadget, Clothing, Saree, etc."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700">
                পণ্যের ছবি <span className="text-slate-400 font-normal">(ঐচ্ছিক)</span>
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="text-[11px] text-rose-500 hover:text-rose-600 flex items-center gap-0.5 cursor-pointer"
                >
                  <X className="h-3 w-3" /> ছবি মুছুন
                </button>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            {imageUrl ? (
              <div className="flex items-center gap-3 p-2.5 rounded-xl border border-indigo-200 bg-indigo-50">
                <div className="h-12 w-12 rounded-lg bg-white overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center">
                  <img src={imageUrl} alt="Product preview" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    ছবি সফলভাবে আপলোড হয়েছে
                  </p>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={isUploadingImage}
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-dashed border-indigo-300 rounded-xl bg-indigo-50/50 hover:bg-indigo-50 text-indigo-600 text-xs font-bold transition-all cursor-pointer"
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> ছবি আপলোড হচ্ছে...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> ডিভাইস থেকে ছবি সিলেক্ট করুন
                  </>
                )}
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-xs mt-2 transition-colors cursor-pointer"
          >
            {isSubmitting ? "সংরক্ষণ হচ্ছে..." : "প্রোডাক্ট ক্যাটালগে যুক্ত করুন"}
          </button>
        </form>
      </Dialog>
    </div>
  );
}
