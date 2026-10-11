import * as React from "react";
import { SubNavTabs, SubNavTab } from "@/components/shared/sub-nav-tabs";

const AI_TRAINING_TABS: SubNavTab[] = [
  { label: "এআই চ্যাট ট্রেইনার", href: "/ai-training/ai-setup", iconName: "sparkles" },
  { label: "স্টোর লিভিং নোটস", href: "/ai-training/train-content", iconName: "sliders" },
];

export default function AiTrainingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenant: string };
}) {
  return (
    <div className="space-y-4">
      <SubNavTabs tenantSlug={params.tenant} tabs={AI_TRAINING_TABS} />
      {children}
    </div>
  );
}
