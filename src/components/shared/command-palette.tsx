"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Inbox,
  ShoppingBag,
  Package,
  Truck,
  PhoneCall,
  Bot,
  Megaphone,
  Radio,
  Flame,
  Sparkles,
  BarChart3,
  Settings,
  CreditCard,
  Users,
  Shield,
  Layers,
  ArrowRight,
  X,
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";

interface CommandItem {
  titleBn: string;
  titleEn: string;
  path: string;
  categoryBn: string;
  categoryEn: string;
  icon: React.ElementType;
}

const commands: CommandItem[] = [
  // Dashboard & Inbox
  { titleBn: "ড্যাশবোর্ড ওভারভিউ", titleEn: "Dashboard Overview", path: "/dashboard", categoryBn: "সাধারণ", categoryEn: "General", icon: LayoutDashboard },
  { titleBn: "ইনবক্স ও লাইভ চ্যাট", titleEn: "Inbox & Live Chat", path: "/inbox", categoryBn: "মেসেজিং", categoryEn: "Messaging", icon: Inbox },
  { titleBn: "ইন্টিগ্রেশনস (মেটা, কুরিয়ার, পেমেন্ট)", titleEn: "Integrations (Meta, Courier, Payment)", path: "/integrations", categoryBn: "সাধারণ", categoryEn: "General", icon: Sparkles },

  // Sales
  { titleBn: "অর্ডার তালিকা ও ম্যানেজমেন্ট", titleEn: "Orders List & Management", path: "/sales/orders", categoryBn: "বিক্রয়", categoryEn: "Sales", icon: Package },
  { titleBn: "প্রোডাক্ট ক্যাটালগ ও ইনভেন্টরি", titleEn: "Product Catalog & Stock", path: "/sales/products", categoryBn: "বিক্রয়", categoryEn: "Sales", icon: ShoppingBag },
  { titleBn: "পার্সেল বুকিং ও কুরিয়ার ট্র্যাকিং", titleEn: "Parcels Booking & Courier", path: "/sales/parcels", categoryBn: "বিক্রয়", categoryEn: "Sales", icon: Truck },
  { titleBn: "অর্ডার ফিল্ডস ও প্রশ্ন কাস্টমাইজেশন", titleEn: "Order Fields & Questions", path: "/sales/orders/fields", categoryBn: "বিক্রয়", categoryEn: "Sales", icon: Layers },

  // Calls
  { titleBn: "এআই ভয়েস কলস ও ভেরিফিকেশন", titleEn: "AI Voice Calls & Verification", path: "/calls/ai-calls", categoryBn: "কলিং", categoryEn: "Calls", icon: PhoneCall },
  { titleBn: "কল রেকর্ডিং ও ট্রান্সক্রিপ্টস", titleEn: "Call Recordings & Transcripts", path: "/calls/recordings", categoryBn: "কলিং", categoryEn: "Calls", icon: Bot },

  // Marketing
  { titleBn: "ব্রডকাস্ট ও বাল্ক মেসেজিং", titleEn: "Broadcast & Bulk Messaging", path: "/marketing/broadcast", categoryBn: "মার্কেটিং", categoryEn: "Marketing", icon: Radio },
  { titleBn: "অ্যাডসফ্লো ও আরওএএস ট্র্যাকিং", titleEn: "AdsFlow & ROAS Tracking", path: "/marketing/ads-flow", categoryBn: "মার্কেটিং", categoryEn: "Marketing", icon: Flame },
  { titleBn: "ক্রিয়েটিভ স্টুডিও (AI কপিরাইটিং)", titleEn: "Creative Studio (AI Copywriting)", path: "/marketing/creative-studio", categoryBn: "মার্কেটিং", categoryEn: "Marketing", icon: Sparkles },

  // AI Training
  { titleBn: "এআই সেটআপ ও ফোন সিমুলেটর", titleEn: "AI Setup & Phone Simulator", path: "/ai-training/ai-setup", categoryBn: "এআই ট্রেনিং", categoryEn: "AI Training", icon: Bot },
  { titleBn: "ট্রেন কনটেন্ট ও FAQ নলেজবেস", titleEn: "Train Content & FAQ Knowledge", path: "/ai-training/train-content", categoryBn: "এআই ট্রেনিং", categoryEn: "AI Training", icon: Layers },

  // Insights
  { titleBn: "বিজনেস অ্যানালিটিক্স ও পারফরম্যান্স", titleEn: "Business Analytics & Growth", path: "/insights/analytics", categoryBn: "ইনসাইটস", categoryEn: "Insights", icon: BarChart3 },
  { titleBn: "অ্যাক্টিভিটি লগ ও অডিট ট্রেইল", titleEn: "Activity Log & Audit Trail", path: "/insights/activity-log", categoryBn: "ইনসাইটস", categoryEn: "Insights", icon: Shield },

  // Settings
  { titleBn: "প্রোফাইল ও স্টোর সেটিংস", titleEn: "Profile & Store Settings", path: "/settings/profile", categoryBn: "সেটিংস", categoryEn: "Settings", icon: Settings },
  { titleBn: "এআই আচরণ ও কনফার্মেশন মেসেজ", titleEn: "AI Behavior & Auto-Replies", path: "/settings/ai-behavior", categoryBn: "সেটিংস", categoryEn: "Settings", icon: Bot },
  { titleBn: "বিজ্ঞপ্তি ও অ্যালার্ট সেটিংস", titleEn: "Notifications & Alerts", path: "/settings/notifications", categoryBn: "সেটিংস", categoryEn: "Settings", icon: Sparkles },
  { titleBn: "বিলিং, ওয়ালেট ও রিচার্জ হিস্ট্রি", titleEn: "Billing, Wallet & Top-up", path: "/settings/billing", categoryBn: "সেটিংস", categoryEn: "Settings", icon: CreditCard },
  { titleBn: "টিম মেম্বারস ও এক্সেস কন্ট্রোল", titleEn: "Team Members & Permissions", path: "/settings/team", categoryBn: "সেটিংস", categoryEn: "Settings", icon: Users },
  { titleBn: "সিকিউরিটি ও পাসওয়ার্ড পরিবর্তন", titleEn: "Security & Password", path: "/settings/security", categoryBn: "সেটিংস", categoryEn: "Settings", icon: Shield },
];

export function CommandPalette({
  tenantSlug,
  open,
  onOpenChange,
}: {
  tenantSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { lang } = useLanguage();
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Global Ctrl + K listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      } else if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  // Focus input when opened
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  // Filter commands
  const filtered = React.useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.titleBn.toLowerCase().includes(q) ||
        c.titleEn.toLowerCase().includes(q) ||
        c.categoryBn.toLowerCase().includes(q) ||
        c.categoryEn.toLowerCase().includes(q) ||
        c.path.toLowerCase().includes(q)
    );
  }, [query]);

  const handleSelect = (path: string) => {
    onOpenChange(false);
    router.push(`/${tenantSlug}${path}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      handleSelect(filtered[selectedIndex].path);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl rounded-2xl border border-border/80 bg-white dark:bg-slate-950 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/70 bg-slate-50/50 dark:bg-slate-900/50">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={lang === "bn" ? "সার্চ করুন বা দ্রুত জাম্প করুন... (যেমন: অর্ডার, কুরিয়ার)" : "Search or jump to... (e.g. orders, billing)"}
            className="flex-1 bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block rounded-md border border-border bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
            ESC
          </kbd>
          <button
            onClick={() => onOpenChange(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-border/40 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              {lang === "bn" ? "কোনো ফিচার বা পেজ খুঁজে পাওয়া যায়নি" : "No results found for your query"}
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.path}
                  onClick={() => handleSelect(item.path)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-indigo-50 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200"
                      : "hover:bg-slate-50 text-slate-700 dark:hover:bg-slate-900 dark:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold truncate">
                        {lang === "bn" ? item.titleBn : item.titleEn}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">
                        {lang === "bn" ? item.categoryBn : item.categoryEn} • {item.path}
                      </span>
                    </div>
                  </div>
                  <ArrowRight
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-transparent"
                    }`}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border/60 bg-slate-50 dark:bg-slate-900 text-[11px] text-slate-400">
          <span>{lang === "bn" ? "নেভিগেট করতে ↑↓ ও সিলেক্ট করতে Enter চাপুন" : "Use ↑↓ to navigate, Enter to select"}</span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">Mogent AI Fast Jump</span>
        </div>
      </div>
    </div>
  );
}
