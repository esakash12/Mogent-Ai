import * as React from "react";
import { SubNavTabs, SubNavTab } from "@/components/shared/sub-nav-tabs";

const MARKETING_TABS: SubNavTab[] = [
  { label: "মেটা অ্যাডস ফ্লো", href: "/marketing/ads-flow", iconName: "barchart" },
  { label: "কাস্টমার ব্রডকাস্ট", href: "/marketing/broadcast", iconName: "zap" },
  { label: "ক্রিয়েটিভ স্টুডিও", href: "/marketing/creative-studio", iconName: "sparkles" },
];

export default function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenant: string };
}) {
  return (
    <div className="space-y-4">
      <SubNavTabs tenantSlug={params.tenant} tabs={MARKETING_TABS} />
      {children}
    </div>
  );
}
