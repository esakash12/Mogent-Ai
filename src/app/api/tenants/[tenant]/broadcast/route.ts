import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(
  req: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: params.tenant },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const [campaigns, whatsappAudience, messengerAudience] = await Promise.all([
      prisma.broadcastCampaign.findMany({
        where: { tenantId: tenant.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.conversation.count({
        where: { tenantId: tenant.id, channelType: "WHATSAPP" },
      }),
      prisma.conversation.count({
        where: { tenantId: tenant.id, channelType: "FACEBOOK" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      campaigns,
      audience: {
        WHATSAPP: whatsappAudience,
        MESSENGER: messengerAudience,
        TOTAL: whatsappAudience + messengerAudience,
      },
    });
  } catch (error: any) {
    console.error("Broadcast fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch broadcasts" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: params.tenant },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const { name, channel = "WHATSAPP", messageText } = await req.json();

    if (!name || !messageText) {
      return NextResponse.json(
        { error: "ক্যাম্পেইনের নাম এবং বার্তা উভয়ই আবশ্যক।" },
        { status: 400 }
      );
    }

    // Calculate reach based on past customer conversations
    const channelType = channel === "MESSENGER" ? "FACEBOOK" : "WHATSAPP";
    const recipientCount = await prisma.conversation.count({
      where: {
        tenantId: tenant.id,
        channelType,
      },
    });

    const campaign = await prisma.broadcastCampaign.create({
      data: {
        tenantId: tenant.id,
        name,
        channel,
        messageText,
        recipientCount: Math.max(recipientCount, 1),
        sentCount: 0,
        status: "SCHEDULED",
      },
    });

    // Record in activity log
    await prisma.activityLog.create({
      data: {
        tenantId: tenant.id,
        action: "BROADCAST_SCHEDULED",
        details: `ব্রডকাস্ট ক্যাম্পেইন '${name}' (${channel}) শিডিউল করা হয়েছে। সম্ভাব্য প্রাপক: ${campaign.recipientCount} জন।`,
      },
    });

    return NextResponse.json({
      success: true,
      campaign,
      message: "ব্রডকাস্ট ক্যাম্পেইন সফলভাবে ডাটাবেজে শিডিউল হয়েছে!",
    });
  } catch (error: any) {
    console.error("Broadcast create error:", error);
    return NextResponse.json(
      { error: error.message || "ব্রডকাস্ট শিডিউল করতে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}
