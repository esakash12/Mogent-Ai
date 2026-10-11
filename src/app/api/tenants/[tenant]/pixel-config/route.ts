import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sendMetaCapiPurchaseEvent } from "@/lib/meta/conversions";

export async function GET(
  req: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: params.tenant },
      select: {
        id: true,
        slug: true,
        metaPixelId: true,
        metaCapiToken: true,
        metaTestEventCode: true,
        metaAdAccountId: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const hasCapiToken = Boolean(tenant.metaCapiToken && tenant.metaCapiToken.trim().length > 0);
    const maskedToken = hasCapiToken && tenant.metaCapiToken
      ? "••••••••" + tenant.metaCapiToken.slice(-6)
      : "";

    return NextResponse.json({
      success: true,
      config: {
        metaPixelId: tenant.metaPixelId || "",
        metaCapiTokenMasked: maskedToken,
        hasCapiToken,
        metaTestEventCode: tenant.metaTestEventCode || "",
        metaAdAccountId: tenant.metaAdAccountId || "",
        isConfigured: Boolean(tenant.metaPixelId && hasCapiToken),
      },
    });
  } catch (error: any) {
    console.error("Fetch pixel config error:", error);
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const body = await req.json();
    const { metaPixelId, metaCapiToken, metaTestEventCode, metaAdAccountId } = body;

    const dataToUpdate: any = {};
    if (metaPixelId !== undefined) dataToUpdate.metaPixelId = metaPixelId.trim();
    if (metaCapiToken !== undefined && metaCapiToken.trim().length > 0) {
      dataToUpdate.metaCapiToken = metaCapiToken.trim();
    }
    if (metaTestEventCode !== undefined) {
      dataToUpdate.metaTestEventCode = metaTestEventCode.trim() || null;
    }
    if (metaAdAccountId !== undefined) {
      dataToUpdate.metaAdAccountId = metaAdAccountId.trim() || null;
    }

    const updated = await prisma.tenant.update({
      where: { slug: params.tenant },
      data: dataToUpdate,
    });

    const hasCapiToken = Boolean(updated.metaCapiToken && updated.metaCapiToken.trim().length > 0);

    return NextResponse.json({
      success: true,
      message: "মেটা পিক্সেল ও কনভার্সন এপিআই সেটিংস সফলভাবে সংরক্ষিত হয়েছে!",
      config: {
        metaPixelId: updated.metaPixelId || "",
        hasCapiToken,
        metaTestEventCode: updated.metaTestEventCode || "",
        metaAdAccountId: updated.metaAdAccountId || "",
        isConfigured: Boolean(updated.metaPixelId && hasCapiToken),
      },
    });
  } catch (error: any) {
    console.error("Update pixel config error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update pixel configuration" },
      { status: 500 }
    );
  }
}

// Live Test Event Dispatcher (POST)
export async function POST(
  req: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const tenant = await prisma.tenant.findUnique({
      where: { slug: params.tenant },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const pixelId = body.metaPixelId || tenant.metaPixelId;
    const capiToken = body.metaCapiToken || tenant.metaCapiToken;
    const testCode = body.metaTestEventCode || tenant.metaTestEventCode;

    if (!pixelId || !capiToken) {
      return NextResponse.json(
        { error: "অনুগ্রহ করে মেটা পিক্সেল আইডি এবং CAPI অ্যাক্সেস টোকেন প্রদান করুন।" },
        { status: 400 }
      );
    }

    const testEventId = `TEST-ORD-${Date.now().toString().slice(-6)}`;
    const testAmount = body.amount || 1500;

    const result = await sendMetaCapiPurchaseEvent({
      pixelId,
      capiAccessToken: capiToken,
      testEventCode: testCode || null,
      eventId: testEventId,
      amount: testAmount,
      currency: "BDT",
      actionSource: "chat",
      userData: {
        phone: "01711000000",
        name: "Test Customer",
        email: "test@mogent.ai",
        city: "Dhaka",
        country: "bd",
      },
      items: [
        {
          productId: "PROD-TEST",
          productName: "CAPI Verification Product",
          quantity: 1,
          unitPrice: testAmount,
        },
      ],
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          details: result.details,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "মেটা টেস্ট পারচেজ ইভেন্ট সফলভাবে পাঠানো হয়েছে!",
      eventsReceived: result.eventsReceived,
      fbtraceId: result.fbtraceId,
      eventId: testEventId,
    });
  } catch (error: any) {
    console.error("Test pixel event error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to dispatch test event" },
      { status: 500 }
    );
  }
}
