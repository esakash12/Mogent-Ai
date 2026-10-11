import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { tenant: string; id: string } }
) {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
      include: {
        channel: true,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Look up recent orders for this customer (by phone or name)
    let customerOrders: any[] = [];
    if (conversation.customerPhone || conversation.customerName) {
      customerOrders = await prisma.order.findMany({
        where: {
          tenantId: conversation.tenantId,
          OR: [
            ...(conversation.customerPhone ? [{ customerPhone: conversation.customerPhone }] : []),
            ...(conversation.customerName && conversation.customerName !== "Facebook Customer" && conversation.customerName !== "Customer"
              ? [{ customerName: conversation.customerName }]
              : []),
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });
    }

    return NextResponse.json({
      success: true,
      conversation,
      orders: customerOrders,
    });
  } catch (error) {
    console.error("Fetch conversation detail error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { tenant: string; id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      customerName,
      customerPhone,
      status,
      aiHandled,
      tags,
      assignedToId,
      takeoverReason,
    } = body;

    const dataToUpdate: any = {};
    if (customerName !== undefined) dataToUpdate.customerName = customerName;
    if (customerPhone !== undefined) dataToUpdate.customerPhone = customerPhone;
    if (status !== undefined) dataToUpdate.status = status;
    if (aiHandled !== undefined) dataToUpdate.aiHandled = aiHandled;
    if (tags !== undefined) dataToUpdate.tags = tags;
    if (assignedToId !== undefined) dataToUpdate.assignedToId = assignedToId;
    if (takeoverReason !== undefined) dataToUpdate.takeoverReason = takeoverReason;

    const updated = await prisma.conversation.update({
      where: { id: params.id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, conversation: updated });
  } catch (error) {
    console.error("Update conversation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
