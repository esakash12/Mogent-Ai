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

    const teamMembers = await prisma.teamMember.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, teamMembers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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

    if (session.role !== "SUPER_ADMIN" && session.tenantSlug !== params.tenant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: params.tenant },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const { name, email, role = "AGENT" } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: "নাম এবং ইমেইল উভয়ই আবশ্যক।" }, { status: 400 });
    }

    const member = await prisma.teamMember.create({
      data: {
        tenantId: tenant.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: role.toUpperCase(),
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      member,
      message: "টিম মেম্বার সফলভাবে যুক্ত করা হয়েছে!",
    });
  } catch (error: any) {
    console.error("Create team member error:", error);
    return NextResponse.json({ error: error.message || "Failed to create team member" }, { status: 500 });
  }
}

export async function DELETE(
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

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("id");

    if (!memberId) {
      return NextResponse.json({ error: "মেম্বার আইডি প্রদান করুন।" }, { status: 400 });
    }

    await prisma.teamMember.deleteMany({
      where: { id: memberId, tenantId: tenant.id },
    });

    return NextResponse.json({ success: true, message: "টিম মেম্বার ডিলিট হয়েছে।" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
