import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { decryptSecret } from "@/lib/encryption";
import { sendFacebookReply } from "@/lib/meta/messages";
import { validateTenantApiAccess } from "@/lib/api-guard";

export async function GET(
  request: Request,
  { params }: { params: { tenant: string; id: string } }
) {
  try {
    const auth = await validateTenantApiAccess(params.tenant);
    if (!auth.authorized) return auth.response!;
    const tenant = auth.tenant!;

    // Verify conversation belongs to this tenant
    const conversation = await prisma.conversation.findFirst({
      where: { id: params.id, tenantId: tenant.id },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: params.id, tenantId: tenant.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error("Fetch messages error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { tenant: string; id: string } }
) {
  try {
    const auth = await validateTenantApiAccess(params.tenant);
    if (!auth.authorized) return auth.response!;
    const tenant = auth.tenant!;

    const {
      content = "",
      mediaUrl = null,
      senderType = "AGENT",
      senderName = "Admin",
    } = await request.json();

    const conversation = await prisma.conversation.findFirst({
      where: { id: params.id, tenantId: tenant.id },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // 1. If this is a Facebook Messenger conversation, dispatch the message live to Messenger
    if (conversation.channelType === "FACEBOOK" && conversation.customerExternalId) {
      let channel = null;
      if (conversation.channelId) {
        channel = await prisma.channel.findUnique({
          where: { id: conversation.channelId },
        });
      }
      if (!channel) {
        channel = await prisma.channel.findFirst({
          where: { tenantId: conversation.tenantId, type: "FACEBOOK", isActive: true },
        });
      }

      if (channel?.accessToken) {
        const pageAccessToken = decryptSecret(channel.accessToken);
        if (pageAccessToken) {
          const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
          const proto = request.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
          const publicBaseUrl = host ? `${proto}://${host}` : null;

          const sendResult = await sendFacebookReply(
            pageAccessToken,
            conversation.customerExternalId,
            content,
            mediaUrl,
            publicBaseUrl
          );
          console.log("[INBOX AGENT REPLY] Live message sent to Messenger:", {
            customerExternalId: conversation.customerExternalId,
            hasMedia: Boolean(mediaUrl),
            success: sendResult?.success,
          });
        }
      }
    }

    // 2. Persist message in database
    const newMessage = await prisma.message.create({
      data: {
        conversationId: params.id,
        tenantId: conversation.tenantId,
        senderType,
        senderName,
        content,
        mediaUrl: mediaUrl || null,
        aiCostBdt: 0, // Human messages cost 0
      },
    });

    // 3. Update conversation lastMessageAt
    await prisma.conversation.update({
      where: { id: params.id },
      data: { lastMessageAt: new Date() },
    });

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
