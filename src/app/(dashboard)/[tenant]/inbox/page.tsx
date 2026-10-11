import * as React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { getOrCreateTenant } from "@/lib/tenant";
import { InboxClient } from "./inbox-client";

export const dynamic = "force-dynamic";

export default async function InboxPage({
  params,
}: {
  params: { tenant: string };
}) {
  const tenant = await getOrCreateTenant(params.tenant);

  if (!tenant) {
    notFound();
  }

  // Fetch real conversations from DB
  const conversations = await prisma.conversation.findMany({
    where: { tenantId: tenant.id },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  // Fetch Facebook post comments
  const comments = await prisma.comment.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
  });

  const formattedConversations = conversations.map((c) => ({
    id: c.id,
    customerName: c.customerName,
    customerPhone: c.customerPhone,
    channelType: c.channelType,
    status: c.status,
    aiHandled: c.aiHandled,
    lastMessageAt: c.lastMessageAt.toISOString(),
    lastMessageText: c.messages[0]?.content || "",
    customerExternalId: c.customerExternalId,
    tags: c.tags,
    takeoverReason: c.takeoverReason,
    assignedToId: c.assignedToId,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Inbox
          </h1>
          <p className="text-xs text-slate-400">
            ওমনিচ্যানেল লাইভ মেসেজিং, AI অটোমেশন ও কাস্টমার সাপোর্ট
          </p>
        </div>
      </div>

      <InboxClient
        tenantSlug={tenant.slug}
        initialConversations={formattedConversations}
        initialComments={comments}
      />
    </div>
  );
}
