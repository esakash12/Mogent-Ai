import prisma from "@/lib/db";
import { buildSystemPrompt } from "./prompts";
import { checkStockTool } from "./tools/check-stock";
import { createOrderTool } from "./tools/create-order";
import { calculateShippingTool } from "./tools/calculate-shipping";

export interface AgentResponse {
  replyText: string;
  verifiedStock: boolean;
  orderCreated: boolean;
  orderSummary?: any;
  aiCostBdt: number;
}

export async function processCustomerMessage(
  tenantId: string,
  customerMessage: string,
  customerName: string = "Customer",
  customerPhone?: string
): Promise<AgentResponse> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      aiSetting: true,
      wallet: true,
      products: { where: { isActive: true } },
    },
  });

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  // Check if AI is active and wallet has balance
  const aiActive = tenant.aiSetting?.aiActive ?? true;
  const currentBalance = tenant.wallet?.balanceBdt ?? 0;

  if (!aiActive || currentBalance <= 0) {
    return {
      replyText: "ধন্যবাদ। আমাদের একজন প্রতিনিধি খুব শীঘ্রই আপনার সাথে যোগাযোগ করবেন।",
      verifiedStock: false,
      orderCreated: false,
      aiCostBdt: 0,
    };
  }

  const aiCostBdt = 0.25; // Standard ৳0.25 margin per AI reply

  const queryLower = customerMessage.toLowerCase();
  let replyText = "";
  let verifiedStock = false;
  let orderCreated = false;
  let orderSummary: any = null;

  // 1. Check for stock queries (e.g. "ase?", "8 pis?", "stock", "dam koto?")
  const products = tenant.products;
  let matchedProduct = products.find((p) =>
    queryLower.includes(p.name.toLowerCase())
  );

  // If no exact match, check if it's a general "ki ache" query
  const isGeneralWhatQuery =
    queryLower.includes("ki ache") ||
    queryLower.includes("কি আছে") ||
    queryLower.includes("কি কি আছে") ||
    queryLower.includes("product");

  if (isGeneralWhatQuery && !replyText) {
    if (products.length > 0) {
      const list = products.slice(0, 3).map((p) => p.name).join(", ");
      replyText = `জি ${tenant.aiSetting?.greetingStyle || "ভাইয়া"}, আমাদের কাছে ${list} সহ আকর্ষণীয় কালেকশন রয়েছে। আপনি কোনটি সম্পর্কে জানতে চান?`;
    } else {
      replyText = `ধন্যবাদ ${tenant.aiSetting?.greetingStyle || "ভাইয়া"}, আমাদের নতুন পণ্যের ক্যাটালগ বর্তমানে আপডেট হচ্ছে। খুব শীঘ্রই আমাদের প্রতিনিধি আপনাকে তালিকা জানিয়ে দেবেন।`;
    }
  } else if (!matchedProduct && products.length > 0) {
    matchedProduct = products[0]; // Match active product in catalog
  }

  const isStockOrPriceQuery =
    queryLower.includes("ase") ||
    queryLower.includes("আছে") ||
    queryLower.includes("pis") ||
    queryLower.includes("পিস") ||
    queryLower.includes("stock") ||
    queryLower.includes("দাম") ||
    queryLower.includes("price") ||
    queryLower.includes("koto");

  if (isStockOrPriceQuery && matchedProduct) {
    const stockResult = await checkStockTool(tenant.id, matchedProduct.name);
    verifiedStock = true;

    // Check if customer asked for more than available stock
    const numberMatch = customerMessage.match(/\d+/);
    const requestedQty = numberMatch ? parseInt(numberMatch[0]) : 1;

    if (stockResult.found && stockResult.stock !== undefined) {
      if (requestedQty > stockResult.stock && stockResult.stock > 0) {
        replyText = `দুঃখিত ${tenant.aiSetting?.greetingStyle || "ভাইয়া"}, আমাদের কাছে বর্তমানে ${stockResult.name} পণ্যটি ${stockResult.stock}টি স্টকে আছে। ${requestedQty} পিস একসাথে দেওয়া সম্ভব হচ্ছে না। আপনি কি ${stockResult.stock}টি নিতে চান? মূল্য: ৳${stockResult.price} প্রতি পিস।`;
      } else if (stockResult.stock > 0) {
        replyText = `জি ${tenant.aiSetting?.greetingStyle || "ভাইয়া"}, আমাদের কাছে বর্তমানে ${stockResult.name} পণ্যটি স্টকে আছে (স্টক: ${stockResult.stock}টি)। মূল্য: ৳${stockResult.price}। আপনি কি অর্ডার করতে চান?`;
      } else {
        replyText = `দুঃখিত ${tenant.aiSetting?.greetingStyle || "ভাইয়া"}, বর্তমানে ${stockResult.name} পণ্যটি স্টক আউট হয়ে গেছে। স্টক আসার সাথে সাথে আপনাকে জানানো হবে।`;
      }
    } else {
      replyText = stockResult.message;
    }
  }

  // 2. Check for order intent (phone number or address provided)
  const phoneMatch = customerMessage.match(/(?:\+?88)?01[3-9]\d{8}/);
  const isOrderIntent =
    phoneMatch ||
    queryLower.includes("order") ||
    queryLower.includes("অর্ডার") ||
    queryLower.includes("ঠিকানা") ||
    queryLower.includes("পাঠিয়ে দেন");

  if (isOrderIntent && !replyText) {
    const detectedPhone = phoneMatch ? phoneMatch[0] : customerPhone || "01700000000";
    const shipping = calculateShippingTool(
      customerMessage,
      tenant.aiSetting?.insideDhakaFee || 60,
      tenant.aiSetting?.outsideDhakaFee || 120
    );

    const productToOrder = matchedProduct || {
      id: undefined,
      name: "Standard Item",
      price: 1500,
    };

    const orderRes = await createOrderTool({
      tenantId: tenant.id,
      customerName,
      customerPhone: detectedPhone,
      deliveryAddress: customerMessage,
      productId: productToOrder.id,
      productName: productToOrder.name,
      quantity: 1,
      deliveryCharge: shipping.fee,
    });

    orderCreated = true;
    orderSummary = {
      orderNumber: orderRes.orderNumber,
      productName: productToOrder.name,
      price: productToOrder.price,
      deliveryCharge: shipping.fee,
      totalAmount: orderRes.totalAmount,
      address: customerMessage,
    };

    replyText = `ধন্যবাদ! আপনার অর্ডারটি সফলভাবে নেওয়া হয়েছে।\n• পণ্য: ${productToOrder.name}\n• ডেলিভারি চার্জ: ৳${shipping.fee}\n• সর্বমোট মূল্য: ৳${orderRes.totalAmount}\n• অর্ডার আইডি: ${orderRes.orderNumber}\n\nআমাদের প্রতিনিধি খুব শীঘ্রই ডেলিভারির জন্য যোগাযোগ করবেন।`;
  }

  // 3. Fallback to general greeting or polite Bengali response
  if (!replyText) {
    replyText = `হ্যালো! '${tenant.name}'-এ আপনাকে স্বাগতম। আমি কীভাবে আপনাকে সহায়তা করতে পারি? কোনো পণ্য দেখতে চাইলে বা পণ্যের নাম লিখে মেসেজ দিন।`;
  }

  // 4. Deduct ৳0.25 from wallet & record in ledger entry in transaction
  if (tenant.wallet) {
    const newBal = Math.max(0, currentBalance - aiCostBdt);
    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: tenant.wallet.id },
        data: { balanceBdt: newBal },
      }),
      prisma.ledgerEntry.create({
        data: {
          walletId: tenant.wallet.id,
          tenantId: tenant.id,
          amount: -aiCostBdt,
          type: "AI_USAGE",
          description: `AI Message Reply (Verified Stock / Automation)`,
          balanceAfter: newBal,
        },
      }),
    ]);
  }

  return {
    replyText,
    verifiedStock,
    orderCreated,
    orderSummary,
    aiCostBdt,
  };
}
