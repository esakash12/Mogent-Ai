import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { validateTenantApiAccess } from "@/lib/api-guard";

export async function GET(
  request: Request,
  { params }: { params: { tenant: string; id: string } }
) {
  try {
    const auth = await validateTenantApiAccess(params.tenant);
    if (!auth.authorized) return auth.response!;
    const tenant = auth.tenant!;

    const order = await prisma.order.findFirst({
      where: {
        id: params.id,
        tenantId: tenant.id,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error("[ORDER GET ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { tenant: string; id: string } }
) {
  try {
    const auth = await validateTenantApiAccess(params.tenant);
    if (!auth.authorized) return auth.response!;
    const tenant = auth.tenant!;

    const body = await request.json();
    const { status, remarks, deliveryAddress, customerPhone, customerName } = body;

    const existingOrder = await prisma.order.findFirst({
      where: {
        id: params.id,
        tenantId: tenant.id,
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: existingOrder.id },
      data: {
        ...(status ? { status: status.toUpperCase() } : {}),
        ...(remarks !== undefined ? { remarks } : {}),
        ...(deliveryAddress ? { deliveryAddress } : {}),
        ...(customerPhone ? { customerPhone } : {}),
        ...(customerName ? { customerName } : {}),
      },
      include: {
        items: true,
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        tenantId: tenant.id,
        action: "UPDATE_ORDER_STATUS",
        details: `অর্ডার #${existingOrder.orderNumber}-এর স্ট্যাটাস পরিবর্তন করা হয়েছে: ${existingOrder.status} ➔ ${updatedOrder.status}`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error("[ORDER PATCH ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { tenant: string; id: string } }
) {
  try {
    const auth = await validateTenantApiAccess(params.tenant);
    if (!auth.authorized) return auth.response!;
    const tenant = auth.tenant!;

    await prisma.order.deleteMany({
      where: {
        id: params.id,
        tenantId: tenant.id,
      },
    });

    return NextResponse.json({ success: true, message: "Order deleted successfully" });
  } catch (error: any) {
    console.error("[ORDER DELETE ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
