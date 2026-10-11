"use client";

import * as React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingBag, Search, Plus, Check, Package, Sparkles, Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { formatCurrencyBdt } from "@/lib/utils";
import { useToast } from "@/lib/toast-context";

interface ProductItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  category?: string | null;
  imageUrl?: string | null;
}

interface ProductsPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantSlug: string;
  onInsertProduct: (formattedText: string) => void;
}

export function ProductsPickerModal({
  open,
  onOpenChange,
  tenantSlug,
  onInsertProduct,
}: ProductsPickerModalProps) {
  const { toast } = useToast();
  const [products, setProducts] = React.useState<ProductItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showAddForm, setShowAddForm] = React.useState(false);

  // New product form states
  const [newTitle, setNewTitle] = React.useState("");
  const [newPrice, setNewPrice] = React.useState("");
  const [newStock, setNewStock] = React.useState("10");
  const [newCategory, setNewCategory] = React.useState("গ্যাজেট ও এক্সেসরিজ");
  const [newImageUrl, setNewImageUrl] = React.useState("");
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const [savingProduct, setSavingProduct] = React.useState(false);
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
          setNewImageUrl(data.url);
          toast.success("ছবি আপলোড সম্পন্ন হয়েছে!");
        }
      } else {
        toast.error("ছবি আপলোড ব্যর্থ হয়েছে");
      }
    } catch {
      toast.error("ছবি আপলোড সার্ভার সমস্যা");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Fetch products
  const loadProducts = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/products`);
      if (res.ok) {
        const data = await res.json();
        if (data.products && Array.isArray(data.products)) {
          setProducts(data.products);
        }
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  React.useEffect(() => {
    if (open) {
      loadProducts();
      setShowAddForm(false);
    }
  }, [open, loadProducts]);

  // Handle Add Product Submit
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrice) return;

    setSavingProduct(true);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTitle.trim(),
          price: parseFloat(newPrice) || 0,
          stock: parseInt(newStock) || 0,
          category: newCategory,
          imageUrl: newImageUrl || null,
        }),
      });

      if (res.ok) {
        toast.success("পণ্য সফলভাবে যোগ করা হয়েছে!");
        setNewTitle("");
        setNewPrice("");
        setNewStock("10");
        setNewImageUrl("");
        setShowAddForm(false);
        loadProducts();
      } else {
        toast.error("পণ্য যোগ করতে সমস্যা হয়েছে");
      }
    } catch {
      toast.error("সার্ভার সমস্যা, আবার চেষ্টা করুন");
    } finally {
      setSavingProduct(false);
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onClose={() => onOpenChange(false)} />
      <DialogHeader>
        <div className="flex items-center justify-between pr-6">
          <DialogTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <ShoppingBag className="h-4 w-4 text-indigo-600" />
            পণ্য ক্যাটালগ (Products)
          </DialogTitle>
          <Button
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            {showAddForm ? "তালিকায় ফিরুন" : "+ নতুন পণ্য যোগ করুন"}
          </Button>
        </div>
      </DialogHeader>

      {/* Add New Product Form */}
      {showAddForm ? (
        <form onSubmit={handleAddProduct} className="space-y-3 py-2 text-xs">
          <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900 text-slate-600 dark:text-slate-300">
            এখানে পণ্য যোগ করলে তা স্টোরের ডাটাবেজে যুক্ত হবে এবং AI ও কাস্টমার সাপোর্টে স্বয়ংক্রিয়ভাবে সক্রিয় হবে।
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              পণ্যের নাম *
            </label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="উদা: Smart Watch Pro / প্রিমিয়াম টি-শার্ট"
              required
              className="h-8 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                মূল্য (BDT) *
              </label>
              <Input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="1500"
                required
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                স্টক পরিমাণ *
              </label>
              <Input
                type="number"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                placeholder="10"
                required
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              ক্যাটাগরি
            </label>
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="ফ্যাশন, গ্যাজেট, হোম ডেকোর..."
              className="h-8 text-xs"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                পণ্যের ছবি <span className="text-slate-400 font-normal">(ঐচ্ছিক / Optional)</span>
              </label>
              {newImageUrl && (
                <button
                  type="button"
                  onClick={() => setNewImageUrl("")}
                  className="text-[11px] text-rose-500 hover:text-rose-600 flex items-center gap-0.5"
                >
                  <X className="h-3 w-3" /> মুছুন
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

            {newImageUrl ? (
              <div className="flex items-center gap-2 p-2 rounded-xl border border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20">
                <div className="h-9 w-9 rounded-lg bg-white overflow-hidden border border-border shrink-0 flex items-center justify-center">
                  <img src={newImageUrl} alt="Preview" className="h-full w-full object-cover" />
                </div>
                <span className="text-[11px] text-indigo-700 dark:text-indigo-300 truncate flex-1">
                  ছবি সংযুক্ত হয়েছে
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[10px] text-indigo-600 font-bold hover:underline shrink-0"
                >
                  পরিবর্তন
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={isUploadingImage}
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-dashed border-indigo-300 dark:border-indigo-800 rounded-xl bg-indigo-50/30 hover:bg-indigo-50 text-indigo-600 text-[11px] font-semibold transition-all cursor-pointer"
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> আপলোড হচ্ছে...
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5" /> ছবি আপলোড করুন (ঐচ্ছিক)
                  </>
                )}
              </button>
            )}
          </div>

          <Button
            type="submit"
            disabled={savingProduct}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-8 text-xs rounded-xl mt-2"
          >
            {savingProduct ? "সেভ হচ্ছে..." : "পণ্য সেভ করুন"}
          </Button>
        </form>
      ) : (
        <div className="space-y-3 py-1 text-xs">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="পণ্য বা ক্যাটাগরি সার্চ করুন..."
              className="pl-8 h-8 text-xs"
            />
          </div>

          {/* Product Items List */}
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1 divide-y divide-border/40">
            {loading ? (
              <div className="py-8 text-center text-slate-400">লোড হচ্ছে...</div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <Package className="h-8 w-8 mx-auto text-slate-300" />
                <p>কোনো পণ্য পাওয়া যায়নি</p>
                <Button
                  size="sm"
                  onClick={() => setShowAddForm(true)}
                  className="h-7 text-xs bg-indigo-600 text-white"
                >
                  + প্রথম পণ্যটি যোগ করুন
                </Button>
              </div>
            ) : (
              filtered.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between pt-2 pb-1 hover:bg-slate-50 dark:hover:bg-slate-900/50 p-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 font-bold shrink-0 border border-indigo-100 dark:border-indigo-900">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-slate-900 dark:text-white truncate text-xs">
                        {product.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span className="font-bold text-emerald-600 font-mono">
                          {formatCurrencyBdt(product.price)}
                        </span>
                        <span>•</span>
                        <span className="text-slate-400">স্টক: {product.stock}টি</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => {
                      const textToInsert = `*${product.name}*\nমূল্য: ${formatCurrencyBdt(product.price)}\nস্টক: ${product.stock > 0 ? "এভেইলএবল (" + product.stock + "টি)" : "স্টক আউট"}\n\nআপনি কি এটি অর্ডার করতে চান?`;
                      onInsertProduct(textToInsert);
                      onOpenChange(false);
                    }}
                    className="h-7 text-[11px] bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg shrink-0 transition-colors"
                  >
                    চ্যাটে দিন
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}
