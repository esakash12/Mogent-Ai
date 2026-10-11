import * as React from "react";
import { SubNavTabs, SubNavTab } from "@/components/shared/sub-nav-tabs";

const INSIGHTS_TABS: SubNavTab[] = [
  { label: "সেলস অ্যানালিটিক্স", href: "/insights/analytics", iconName: "activity" },
  { label: "অ্যাক্টিভিটি ও অডিট লগ", href: "/insights/activity-log", iconName: "zap" },
];

export default function InsightsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenant: string };
}) {
  return (
    <div className="space-y-4">
      <SubNavTabs tenantSlug={params.tenant} tabs={INSIGHTS_TABS} />
      {children}
    </div>
  );
}
