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

    const body = await req.json();
    const { name, contactPerson, businessEmail, phone, businessType } = body;

    const updated = await prisma.tenant.update({
      where: { slug: params.tenant },
      data: {
        name: name?.trim() || undefined,
        contactPerson: contactPerson?.trim() || null,
        businessEmail: businessEmail?.trim() || null,
        phone: phone?.trim() || null,
        businessType: businessType || "E-commerce",
      },
    });

    return NextResponse.json({
      success: true,
      message: "প্রোফাইল তথ্য সফলভাবে আপডেট হয়েছে!",
      tenant: updated,
    });
  } catch (error: any) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
