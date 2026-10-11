import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { checkAuthRateLimit } from "@/lib/rate-limiter";
import { signSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rateCheck = checkAuthRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `অতিরিক্ত লগইন চেষ্টা। অনুগ্রহ করে ${rateCheck.resetInSeconds} সেকেন্ড অপেক্ষা করুন।`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "সুপার এডমিন ইমেইল এবং পাসওয়ার্ড প্রদান করুন।" },
        { status: 400 }
      );
    }

    const masterEmail = (process.env.SUPER_ADMIN_EMAIL || "admin@mogent.ai").toLowerCase().trim();
    const masterPassword = process.env.SUPER_ADMIN_PASSWORD || "admin123456";

    // 1. Check if matching master environment credentials
    const isMasterMatch =
      email.toLowerCase().trim() === masterEmail && password === masterPassword;

    // 2. Or check in database for SUPER_ADMIN role user
    let user = await prisma.user.findFirst({
      where: { email: email.toLowerCase().trim(), role: "SUPER_ADMIN" },
    });

    let isValid = isMasterMatch;
    if (!isValid && user) {
      isValid = await bcrypt.compare(password, user.password);
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "সুপার অ্যাডমিন ক্রেডেনশিয়াল সঠিক নয়।" },
        { status: 401 }
      );
    }

    // Ensure super admin record exists in DB
    if (!user) {
      const hashed = await bcrypt.hash(masterPassword, 10);
      user = await prisma.user.upsert({
        where: { email: masterEmail },
        update: { role: "SUPER_ADMIN" },
        create: {
          email: masterEmail,
          name: "Super Administrator",
          password: hashed,
          role: "SUPER_ADMIN",
        },
      });
    }

    // Sign 7-day Super Admin Session
    const token = signSessionToken({
      userId: user.id,
      tenantId: "platform-master",
      tenantSlug: "admin",
      role: "SUPER_ADMIN",
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      message: "সুপার অ্যাডমিন লগইন সফল হয়েছে!",
      redirectUrl: "/admin",
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
    console.error("Super Admin Login error:", error);
    return NextResponse.json(
      { error: "সুপার এডমিন লগইন প্রক্রিয়ায় সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
