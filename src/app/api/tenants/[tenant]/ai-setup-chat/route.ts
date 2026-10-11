import { NextRequest, NextResponse } from "next/server";
import { synthesizeMerchantMemory } from "@/lib/ai/memory-synthesizer";

export async function POST(
  req: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "বার্তা প্রদান করুন" },
        { status: 400 }
      );
    }

    const result = await synthesizeMerchantMemory(params.tenant, message);

    return NextResponse.json({
      ...result,
    });
  } catch (error: any) {
    console.error("AI Setup Chat error:", error);
    return NextResponse.json(
      { error: error.message || "পলিসি প্রসেসিং ব্যর্থ হয়েছে" },
      { status: 500 }
    );
  }
}
