import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { validateTenantApiAccess } from "@/lib/api-guard";

export async function GET(
  request: Request,
  { params }: { params: { tenant: string } }
) {
  try {
    const auth = await validateTenantApiAccess(params.tenant);
    if (!auth.authorized) return auth.response!;
    const tenant = auth.tenant!;

    const products = await prisma.product.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error("Fetch products error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { tenant: string } }
) {
  try {
    const auth = await validateTenantApiAccess(params.tenant);
    if (!auth.authorized) return auth.response!;
    const tenant = auth.tenant!;

    const body = await request.json();
    const { name, price, stock = 0, category = "Gadget", imageUrl, description } = body;

    const product = await prisma.product.create({
      data: {
        tenantId: tenant.id,
        name,
        price: parseFloat(price) || 0,
        stock: parseInt(stock) || 0,
        category,
        imageUrl,
        description,
        source: "MANUAL",
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { tenant: string } }
) {
  try {
    const auth = await validateTenantApiAccess(params.tenant);
    if (!auth.authorized) return auth.response!;
    const tenant = auth.tenant!;

    const { productId, stock } = await request.json();

    const existingProduct = await prisma.product.findFirst({
      where: { id: productId, tenantId: tenant.id },
    });
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found or unauthorized" }, { status: 404 });
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { stock: parseInt(stock) || 0 },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error("Update stock error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
