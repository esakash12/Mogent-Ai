import * as React from "react";
import { SubNavTabs, SubNavTab } from "@/components/shared/sub-nav-tabs";

const CALLS_TABS: SubNavTab[] = [
  { label: "এআই ভয়েস কল ডায়ালার", href: "/calls/ai-calls", iconName: "radio" },
  { label: "কল রেকর্ডিং ও ট্র্যান্সক্রিপ্ট", href: "/calls/recordings", iconName: "mic" },
];

export default function CallsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenant: string };
}) {
  return (
    <div className="space-y-4">
      <SubNavTabs tenantSlug={params.tenant} tabs={CALLS_TABS} />
      {children}
    </div>
  );
}
