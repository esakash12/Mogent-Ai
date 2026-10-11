import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { validateTenantApiAccess } from "@/lib/api-guard";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const auth = await validateTenantApiAccess(params.tenant);
    if (!auth.authorized) return auth.response!;
    const tenant = auth.tenant!;

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

    return NextResponse.json({ success: true, conversations: formattedConversations });
  } catch (error) {
    console.error("Fetch conversations error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
