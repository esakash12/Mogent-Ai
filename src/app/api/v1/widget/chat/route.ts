import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { checkChatRateLimit } from "@/lib/rate-limiter";
import { dispatchAiResponse } from "@/lib/ai/model-switcher";

// Handle CORS Preflight
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") || "*";
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}

export async function POST(req: NextRequest) {
  const reqOrigin = req.headers.get("origin") || "*";
  const corsHeaders = {
    "Access-Control-Allow-Origin": reqOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  try {
    // 1. Sliding Window Rate Limiting (Security Layer 3: Max 20 msgs/min per IP)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rateCheck = checkChatRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `অতিরিক্ত বার্তা পাঠানো হয়েছে। অনুগ্রহ করে ${rateCheck.resetInSeconds} সেকেন্ড অপেক্ষা করুন।`,
        },
        { status: 429, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const { tenant: tenantSlug, message, customerName, customerPhone } = body;

    if (!tenantSlug || !message) {
      return NextResponse.json(
        { error: "Tenant slug and message are required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // 2. Fetch Tenant from PostgreSQL
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug.toLowerCase() },
      include: {
        aiSetting: true,
        wallet: true,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // 3. Widget Domain Whitelisting (Security Layer 1)
    if (tenant.allowedDomains && tenant.allowedDomains.trim().length > 0) {
      const originHeader = req.headers.get("origin") || req.headers.get("referer");
      if (!originHeader) {
        return NextResponse.json(
          { error: "Origin or Referer header required for domain-whitelisted widget access." },
          { status: 403, headers: corsHeaders }
        );
      }

      try {
        const originUrl = new URL(originHeader);
        const requestHost = originUrl.hostname.toLowerCase();
        const allowedList = tenant.allowedDomains
          .split(",")
          .map((d) => d.trim().toLowerCase())
          .filter(Boolean);

        const isAuthorized = allowedList.some(
          (domain) =>
            requestHost === domain ||
            requestHost.endsWith("." + domain) ||
            domain === "localhost" ||
            domain === "127.0.0.1"
        );

        if (!isAuthorized) {
          return NextResponse.json(
            {
              error: `ডোমেইন অননুমোদিত (${requestHost})। অনুগ্রহ করে মোগেন্ট এআই ড্যাশবোর্ডের সেটিংসে গিয়ে Allowed Domains তালিকায় এই ডোমেইনটি যুক্ত করুন।`,
            },
            { status: 403, headers: corsHeaders }
          );
        }
      } catch (e) {
        return NextResponse.json(
          { error: "Invalid origin header. Request forbidden." },
          { status: 403, headers: corsHeaders }
        );
      }
    }

    // 4. Real-time Pre-Execution Wallet Check (Phase 5 Protection)
    if (!tenant.wallet || tenant.wallet.balanceBdt <= 0) {
      return NextResponse.json(
        {
          replyText: "দুঃখিত, স্টোরের মেসেজ ব্যালেন্স শেষ হয়ে গেছে। AI অ্যাসিস্ট্যান্ট সাময়িকভাবে স্থগিত। অনুগ্রহ করে স্টোর ড্যাশবোর্ড থেকে রিচার্জ করুন।",
          insufficientBalance: true,
        },
        { status: 200, headers: corsHeaders }
      );
    }

    // 5. Process customer message via Central AI Model Switcher (Gemini / GPT / Local)
    const agentResponse = await dispatchAiResponse(
      tenant.id,
      message,
      customerName || "Website Visitor",
      customerPhone
    );

    return NextResponse.json(
      {
        success: true,
        storeName: tenant.name,
        replyText: agentResponse.replyText,
        verifiedStock: agentResponse.verifiedStock,
        orderCreated: agentResponse.orderCreated,
        orderSummary: agentResponse.orderSummary,
        modelUsed: agentResponse.modelUsed,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Widget chat error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
