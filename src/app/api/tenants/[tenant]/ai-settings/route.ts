import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { validateTenantApiAccess } from "@/lib/api-guard";

export async function POST(
  request: Request,
  { params }: { params: { tenant: string } }
) {
  try {
    const auth = await validateTenantApiAccess(params.tenant);
    if (!auth.authorized) return auth.response!;
    const tenant = auth.tenant!;

    const body = await request.json();
    const { insideDhakaFee, outsideDhakaFee, bkashNumber, returnPolicy } = body;

    const updated = await prisma.aiSetting.upsert({
      where: { tenantId: tenant.id },
      update: {
        insideDhakaFee: parseFloat(insideDhakaFee) || 60,
        outsideDhakaFee: parseFloat(outsideDhakaFee) || 120,
        bkashNumber,
        returnPolicy,
      },
      create: {
        tenantId: tenant.id,
        insideDhakaFee: parseFloat(insideDhakaFee) || 60,
        outsideDhakaFee: parseFloat(outsideDhakaFee) || 120,
        bkashNumber,
        returnPolicy,
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error("Save AI settings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
