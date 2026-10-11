"use client";

import * as React from "react";

export type Language = "bn" | "en";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  bn: {
    // Brand & Header
    "brand.plan": "স্ট্যান্ডার্ড প্ল্যান",
    "header.wallet": "ওয়ালেট",
    "header.payg": "PAYG",
    "header.topup": "রিচার্জ",
    "header.ai_active": "এআই সক্রিয়",
    "header.logout": "লগআউট",
    "header.support": "সাপোর্ট",

    // Sidebar Nav
    "nav.dashboard": "ড্যাশবোর্ড",
    "nav.inbox": "ইনবক্স",
    "nav.live": "লাইভ",
    "nav.integrations": "ইন্টিগ্রেশনস",

    // Sales
    "nav.sales": "বিক্রয়",
    "nav.orders": "অর্ডারসমূহ",
    "nav.products": "পণ্যসমূহ",
    "nav.parcels": "পার্সেল ও কুরিয়ার",
    "nav.order_fields": "অর্ডার ফিল্ডস",

    // Calls
    "nav.calls": "কলিং",
    "nav.ai_calls": "এআই ভয়েস কলস",
    "nav.recordings": "কল রেকর্ডিংস",

    // Marketing
    "nav.marketing": "মার্কেটিং",
    "nav.broadcast": "ব্রডকাস্ট মেসেজিং",
    "nav.ads_flow": "অ্যাডসফ্লো (ROAS)",
    "nav.creative_studio": "ক্রিয়েটিভ স্টুডিও",

    // AI Training
    "nav.ai_training": "এআই ট্রেনিং",
    "nav.ai_setup": "এআই সেটআপ ও টেস্ট",
    "nav.train_content": "ট্রেন কনটেন্ট ও FAQ",

    // Insights
    "nav.insights": "ইনসাইটস",
    "nav.analytics": "অ্যানালিটিক্স",
    "nav.activity_log": "অ্যাক্টিভিটি লগ",

    // Settings
    "nav.settings": "সেটিংস",
    "nav.profile": "প্রোফাইল ও তথ্য",
    "nav.ai_behavior": "এআই আচরণ",
    "nav.notifications": "বিজ্ঞপ্তি সেটিংস",
    "nav.billing": "বিলিং ও ওয়ালেট",
    "nav.team": "টিম মেম্বারস",
    "nav.security": "সিকিউরিটি",

    // Profile Footer
    "footer.store_owner": "স্টোর ওনার",
  },
  en: {
    // Brand & Header
    "brand.plan": "Standard Plan",
    "header.wallet": "Wallet",
    "header.payg": "PAYG",
    "header.topup": "Top-up",
    "header.ai_active": "AI Active",
    "header.logout": "Logout",
    "header.support": "Support",

    // Sidebar Nav
    "nav.dashboard": "Dashboard",
    "nav.inbox": "Inbox",
    "nav.live": "Live",
    "nav.integrations": "Integrations",

    // Sales
    "nav.sales": "Sales",
    "nav.orders": "Orders",
    "nav.products": "Products",
    "nav.parcels": "Parcels & Courier",
    "nav.order_fields": "Order Fields",

    // Calls
    "nav.calls": "Calls",
    "nav.ai_calls": "AI Voice Calls",
    "nav.recordings": "Recordings",

    // Marketing
    "nav.marketing": "Marketing",
    "nav.broadcast": "Broadcast",
    "nav.ads_flow": "AdsFlow",
    "nav.creative_studio": "Creative Studio",

    // AI Training
    "nav.ai_training": "AI Training",
    "nav.ai_setup": "AI Setup & Simulator",
    "nav.train_content": "Train Content & FAQ",

    // Insights
    "nav.insights": "Insights",
    "nav.analytics": "Analytics",
    "nav.activity_log": "Activity Log",

    // Settings
    "nav.settings": "Settings",
    "nav.profile": "Profile & Info",
    "nav.ai_behavior": "AI Behavior",
    "nav.notifications": "Notifications",
    "nav.billing": "Billing & Wallet",
    "nav.team": "Team Members",
    "nav.security": "Security",

    // Profile Footer
    "footer.store_owner": "Store Owner",
  },
};

const LanguageContext = React.createContext<LanguageContextType>({
  lang: "bn",
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Language>("bn");

  // Load from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("mogent_lang") as Language | null;
      if (stored === "en" || stored === "bn") {
        setLangState(stored);
      }
    } catch {
      // Ignore localStorage unavailable
    }
  }, []);

  const setLang = React.useCallback((newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem("mogent_lang", newLang);
    } catch {
      // Ignore
    }
  }, []);

  const t = React.useCallback(
    (key: string): string => {
      const dict = translations[lang] || translations.bn;
      return dict[key] || translations.en[key] || key;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return React.useContext(LanguageContext);
}
