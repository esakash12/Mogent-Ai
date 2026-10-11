import { NextRequest, NextResponse } from "next/server";
import { handleWhatsAppEmbeddedSignup } from "@/lib/meta/whatsapp-embedded";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantSlug, wabaId, phoneNumberId, code, phoneNumber, accessToken } = body;

    if (!tenantSlug || !phoneNumberId) {
      return NextResponse.json(
        { error: "Missing required WhatsApp onboarding parameters (tenantSlug, phoneNumberId)" },
        { status: 400 }
      );
    }

    const effectiveWabaId = wabaId || `waba_${phoneNumberId}`;

    const result = await handleWhatsAppEmbeddedSignup({
      tenantSlug,
      wabaId: effectiveWabaId,
      phoneNumberId,
      code,
      phoneNumber,
      accessToken,
    });

    return NextResponse.json({
      success: true,
      message: "হোয়াটসঅ্যাপ বিজনেস অ্যাকাউন্ট সফলভাবে সংযুক্ত হয়েছে!",
      channel: result.channel,
    });
  } catch (error: any) {
    console.error("WhatsApp Embedded Signup API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
