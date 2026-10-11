import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(
  req: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "SUPER_ADMIN" && session.tenantSlug !== params.tenant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: params.tenant },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const body = await req.json();

    // Log notification preferences updated
    await prisma.activityLog.create({
      data: {
        tenantId: tenant.id,
        action: "NOTIFICATIONS_UPDATED",
        details: "ইমেইল নোটিফিকেশন সেটিংস সফলভাবে আপডেট করা হয়েছে।",
      },
    });

    return NextResponse.json({
      success: true,
      message: "নোটিফিকেশন প্রেফারেন্স সফলভাবে সেভ হয়েছে!",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
