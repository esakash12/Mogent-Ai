import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: { tenant: string; id: string } }
) {
  try {
    const { aiHandled } = await request.json();
    const isAi = Boolean(aiHandled);

    const updated = await prisma.conversation.update({
      where: { id: params.id },
      data: {
        aiHandled: isAi,
        ...(isAi ? { status: "OPEN", takeoverReason: null } : {}),
      },
    });

    return NextResponse.json({ success: true, aiHandled: updated.aiHandled });
  } catch (error) {
    console.error("Toggle AI error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
