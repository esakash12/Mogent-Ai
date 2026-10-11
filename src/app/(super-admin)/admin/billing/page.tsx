import * as React from "react";
import prisma from "@/lib/db";
import { BillingSettingsClient } from "./billing-client";

export const dynamic = "force-dynamic";

export default async function SuperAdminBillingSettingsPage() {
  const config = await prisma.superAdminConfig.findFirst();

  return (
    <BillingSettingsClient initialCost={config?.perMessageCost ?? 0.25} />
  );
}

