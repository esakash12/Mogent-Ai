import * as React from "react";
import { SubNavTabs, SubNavTab } from "@/components/shared/sub-nav-tabs";

const SETTINGS_TABS: SubNavTab[] = [
  { label: "শপ প্রোফাইল", href: "/settings/profile", iconName: "usercheck" },
  { label: "এআই বিহেভিয়ার", href: "/settings/ai-behavior", iconName: "sliders" },
  { label: "টিম মেম্বারস", href: "/settings/team", iconName: "users" },
  { label: "বিলিং ও ওয়ালেট", href: "/settings/billing", iconName: "creditcard" },
  { label: "নোটিফিকেশন", href: "/settings/notifications", iconName: "bell" },
  { label: "সিকিউরিটি", href: "/settings/security", iconName: "shield" },
];

export default function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenant: string };
}) {
  return (
    <div className="space-y-4">
      <SubNavTabs tenantSlug={params.tenant} tabs={SETTINGS_TABS} />
      {children}
    </div>
  );
}
