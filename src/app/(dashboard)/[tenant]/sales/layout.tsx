import * as React from "react";
import { SubNavTabs, SubNavTab } from "@/components/shared/sub-nav-tabs";

const SALES_TABS: SubNavTab[] = [
  { label: "অর্ডার তালিকা", href: "/sales/orders", iconName: "package" },
  { label: "পার্সেল ও কুরিয়ার", href: "/sales/parcels", iconName: "truck" },
  { label: "প্রোডাক্ট ও স্টক", href: "/sales/products", iconName: "layers", badge: "সফট-লক" },
  { label: "অর্ডার ফিল্ডস", href: "/sales/orders/fields", iconName: "spreadsheet" },
];

export default function SalesLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenant: string };
}) {
  return (
    <div className="space-y-4">
      <SubNavTabs tenantSlug={params.tenant} tabs={SALES_TABS} />
      {children}
    </div>
  );
}
