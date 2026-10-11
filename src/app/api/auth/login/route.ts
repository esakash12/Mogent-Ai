import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { checkAuthRateLimit } from "@/lib/rate-limiter";
import { signSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    // 1. Sliding Window Rate Limiting (Max 5 attempts / min)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rateCheck = checkAuthRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `অতিরিক্ত বার লগইন চেষ্টা করা হয়েছে। অনুগ্রহ করে ${rateCheck.resetInSeconds} সেকেন্ড অপেক্ষা করুন।`,
        },
        { status: 429 }
      );
    }

    // 2. Parse & Validate input
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "ইমেইল এবং পাসওয়ার্ড উভয়ই প্রদান করুন।" },
        { status: 400 }
      );
    }

    // 3. Find user in database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { tenant: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "প্রদত্ত ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।" },
        { status: 401 }
      );
    }

    // 4. Verify password with bcrypt
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "প্রদত্ত ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।" },
        { status: 401 }
      );
    }

    // 5. Build session payload
    const tenantSlug = user.tenant?.slug || "dashboard";
    const token = signSessionToken({
      userId: user.id,
      tenantId: user.tenantId || "",
      tenantSlug,
      role: user.role,
      email: user.email,
      name: user.name,
    });

    // 6. Set 7-Day HTTP-Only Cookie
    const redirectUrl =
      user.role === "SUPER_ADMIN"
        ? "/admin"
        : user.tenant
        ? `/${user.tenant.slug}/dashboard`
        : "/login";

    const response = NextResponse.json({
      success: true,
      message: "লগইন সফল হয়েছে!",
      redirectUrl,
      tenantSlug,
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "লগইন প্রক্রিয়ায় সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।" },
      { status: 500 }
    );
  }
}
