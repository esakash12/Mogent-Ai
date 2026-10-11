import { NextRequest, NextResponse } from "next/server";
import { processMultimodalTraining } from "@/lib/ai/multimodal-synthesizer";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const body = await req.json();
    const { text, audioBase64, audioMimeType, imageBase64, imageMimeType } = body;

    if (!text && !audioBase64 && !imageBase64) {
      return NextResponse.json(
        { error: "অনুগ্রহ করে টেক্সট, অডিও বার্তা অথবা ছবি প্রদান করুন।" },
        { status: 400 }
      );
    }

    const result = await processMultimodalTraining({
      tenantSlug: params.tenant,
      text,
      audioBase64,
      audioMimeType,
      imageBase64,
      imageMimeType,
    });

    return NextResponse.json({
      ...result,
    });
  } catch (error: any) {
    console.error("Multimodal Training API Error:", error);
    return NextResponse.json(
      { error: error.message || "মাল্টিমোডাল প্রসেসিং ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}
