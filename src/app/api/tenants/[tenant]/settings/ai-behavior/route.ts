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
    const {
      orderConfirmationTemplate,
      unknownPhotoAction,
      orderChangeAction,
      enableCatalogCards,
      catalogLocationUrl,
    } = body;

    const updated = await prisma.aiSetting.upsert({
      where: { tenantId: tenant.id },
      update: {
        orderConfirmationTemplate: orderConfirmationTemplate !== undefined ? orderConfirmationTemplate : undefined,
        unknownPhotoAction: unknownPhotoAction || "ASK_NEVER_GUESS",
        orderChangeAction: orderChangeAction || "HANDOFF_TO_TEAM",
        enableCatalogCards: enableCatalogCards !== undefined ? Boolean(enableCatalogCards) : undefined,
        catalogLocationUrl: catalogLocationUrl !== undefined ? catalogLocationUrl : undefined,
      },
      create: {
        tenantId: tenant.id,
        orderConfirmationTemplate,
        unknownPhotoAction: unknownPhotoAction || "ASK_NEVER_GUESS",
        orderChangeAction: orderChangeAction || "HANDOFF_TO_TEAM",
        enableCatalogCards: enableCatalogCards !== undefined ? Boolean(enableCatalogCards) : true,
        catalogLocationUrl: catalogLocationUrl || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "AI আচরণবিধি সফলভাবে সেভ হয়েছে!",
      settings: updated,
    });
  } catch (error: any) {
    console.error("Save AI behavior error:", error);
    return NextResponse.json({ error: error.message || "Failed to save settings" }, { status: 500 });
  }
}
