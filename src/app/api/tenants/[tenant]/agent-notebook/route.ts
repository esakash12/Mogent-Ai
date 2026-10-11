import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

// GET: Fetch all active Living Notebook entries for the tenant
export async function GET(
  req: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: params.tenant },
      select: { id: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const memories = await prisma.agentMemoryEntry.findMany({
      where: { tenantId: tenant.id },
      orderBy: [{ category: "asc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json({ success: true, memories });
  } catch (error: any) {
    console.error("Fetch agent memories error:", error);
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
  }
}

// POST: Manually create a note in the Living Notebook
export async function POST(
  req: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: params.tenant },
      select: { id: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      title,
      content,
      category = "CUSTOM_RULE",
      tags = [],
    } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: "নোটের শিরোনাম ও বিস্তারিত বিবরণ আবশ্যক" },
        { status: 400 }
      );
    }

    const newEntry = await prisma.agentMemoryEntry.create({
      data: {
        tenantId: tenant.id,
        title: title.trim(),
        content: content.trim(),
        category,
        tags: Array.isArray(tags) ? tags : [],
        source: "MANUAL_DASHBOARD",
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "নোটটি সফলভাবে সংরক্ষিত হয়েছে!",
      entry: newEntry,
    });
  } catch (error: any) {
    console.error("Create agent memory error:", error);
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
  }
}

// PUT: Update an existing note
export async function PUT(
  req: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: params.tenant },
      select: { id: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const body = await req.json();
    const { id, title, content, category, tags, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "Note ID আবশ্যক" }, { status: 400 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await prisma.agentMemoryEntry.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "নোটটি সফলভাবে আপডেট হয়েছে!",
      entry: updated,
    });
  } catch (error: any) {
    console.error("Update agent memory error:", error);
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
  }
}

// DELETE: Remove a note
export async function DELETE(
  req: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const queryId = searchParams.get("id");
    let id = queryId;

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json({ error: "Note ID আবশ্যক" }, { status: 400 });
    }

    await prisma.agentMemoryEntry.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "নোটটি সফলভাবে মুছে ফেলা হয়েছে!",
    });
  } catch (error: any) {
    console.error("Delete agent memory error:", error);
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
  }
}
