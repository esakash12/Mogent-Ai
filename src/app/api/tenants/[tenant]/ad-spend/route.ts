import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getOrCreateTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const tenant = await getOrCreateTenant(params.tenant);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const adSpends = await prisma.adSpend.findMany({
      where: { tenantId: tenant.id },
      orderBy: { date: "desc" },
    });

    const totalAdSpend = adSpends.reduce((acc, curr) => acc + curr.amount, 0);

    return NextResponse.json({
      success: true,
      adSpends,
      totalAdSpend,
    });
  } catch (error: any) {
    console.error("Fetch ad spend error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const tenant = await getOrCreateTenant(params.tenant);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const body = await request.json();
    const { amount, date, campaignName = "Meta Ad Campaign", platform = "FACEBOOK", notes } = body;

    if (!amount || isNaN(parseFloat(amount))) {
      return NextResponse.json({ error: "সঠিক খরচের পরিমাণ প্রদান করুন" }, { status: 400 });
    }

    const newSpend = await prisma.adSpend.create({
      data: {
        tenantId: tenant.id,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        campaignName,
        platform,
        notes,
      },
    });

    return NextResponse.json({ success: true, adSpend: newSpend });
  } catch (error: any) {
    console.error("Create ad spend error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const tenant = await getOrCreateTenant(params.tenant);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.adSpend.deleteMany({
      where: { id, tenantId: tenant.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete ad spend error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
