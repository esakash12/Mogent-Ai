import prisma from "@/lib/db";

export async function checkStockTool(tenantId: string, productNameQuery: string) {
  // Find product matching name query
  const product = await prisma.product.findFirst({
    where: {
      tenantId,
      isActive: true,
      name: {
        contains: productNameQuery,
        mode: "insensitive",
      },
    },
  });

  if (!product) {
    return {
      found: false,
      message: `আমাদের ক্যাটালগে '${productNameQuery}' নামে কোনো পণ্য পাওয়া যায়নি।`,
    };
  }

  return {
    found: true,
    productId: product.id,
    name: product.name,
    price: product.price,
    stock: product.stock,
    inStock: product.stock > 0,
    imageUrl: product.imageUrl,
    message:
      product.stock > 0
        ? `বর্তমানে '${product.name}' পণ্যটি ${product.stock} টি স্টকে আছে। মূল্য: ৳${product.price}।`
        : `দুঃখিত, '${product.name}' পণ্যটি বর্তমানে স্টক আউট।`,
  };
}
