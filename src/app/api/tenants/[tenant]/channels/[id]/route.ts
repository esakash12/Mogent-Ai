import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { tenant: string; id: string } }
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

    if (session.role !== "SUPER_ADMIN" && session.tenantSlug !== params.tenant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { isActive } = body;

    const channel = await prisma.channel.findFirst({
      where: { id: params.id, tenantId: tenant.id },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const updated = await prisma.channel.update({
      where: { id: channel.id },
      data: { isActive: Boolean(isActive) },
    });

    return NextResponse.json({
      success: true,
      channel: {
        id: updated.id,
        type: updated.type,
        pageName: updated.pageName,
        pageId: updated.pageId,
        isActive: updated.isActive,
      },
    });
  } catch (error: any) {
    console.error("Channel toggle error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update channel" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tenant: string; id: string } }
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

    if (session.role !== "SUPER_ADMIN" && session.tenantSlug !== params.tenant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const channel = await prisma.channel.findFirst({
      where: { id: params.id, tenantId: tenant.id },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    await prisma.channel.delete({
      where: { id: channel.id },
    });

    return NextResponse.json({
      success: true,
      message: "পেজ সফলভাবে ডিসকানেক্ট করা হয়েছে।",
    });
  } catch (error: any) {
    console.error("Channel delete error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete channel" },
      { status: 500 }
    );
  }
}
