import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { checkAuthRateLimit } from "@/lib/rate-limiter";
import { signSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    // 1. IP-based Rate Limiting (Max 5 attempts / min)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rateCheck = checkAuthRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `অতিরিক্ত রিকোয়েস্ট এসেছে। অনুগ্রহ করে ${rateCheck.resetInSeconds} সেকেন্ড পর পুনরায় চেষ্টা করুন।`,
        },
        { status: 429 }
      );
    }

    // 2. Parse & Validate input
    const body = await req.json();
    const { name, email, password, storeName, slug } = body;

    if (!name || !email || !password || !storeName || !slug) {
      return NextResponse.json(
        { error: "সকল তথ্য সঠিকভাবে পূরণ করুন (নাম, ইমেইল, পাসওয়ার্ড, স্টোরের নাম ও স্ল্যাগ)।" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।" },
        { status: 400 }
      );
    }

    // Slug format validation (lowercase alphanumeric + hyphens)
    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    if (!cleanSlug || cleanSlug.length < 2) {
      return NextResponse.json(
        { error: "স্টোর স্ল্যাগটি ইংরেজি অক্ষর এবং সংখ্যার হতে হবে।" },
        { status: 400 }
      );
    }

    // 3. Uniqueness checks in database
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে।" },
        { status: 400 }
      );
    }

    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: cleanSlug },
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: `"${cleanSlug}" স্ল্যাগটি ইতিমধ্যে ব্যবহৃত। অন্য কোনো নাম চেষ্টা করুন।` },
        { status: 400 }
      );
    }

    // 4. Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Database Transaction: Create Tenant, User, Wallet, default AiSetting
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: storeName.trim(),
          slug: cleanSlug,
          contactPerson: name.trim(),
          businessEmail: email.toLowerCase().trim(),
          plan: "STANDARD",
          wallet: {
            create: {
              balanceBdt: 0.0, // Fresh clean store starts with zero dummy balance
            },
          },
          aiSetting: {
            create: {
              aiActive: true,
              insideDhakaFee: 60.0,
              outsideDhakaFee: 120.0,
              greetingStyle: "ভাইয়া / আপু",
              language: "bn",
            },
          },
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          role: "OWNER",
        },
      });

      return { tenant, user };
    });

    // 6. Sign 7-day Session Token
    const token = signSessionToken({
      userId: result.user.id,
      tenantId: result.tenant.id,
      tenantSlug: result.tenant.slug,
      role: result.user.role,
      email: result.user.email,
      name: result.user.name,
    });

    // 7. Set HTTP-Only 7-Day Session Cookie
    const response = NextResponse.json({
      success: true,
      message: "অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!",
      tenantSlug: result.tenant.slug,
      redirectUrl: `/${result.tenant.slug}/dashboard`,
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
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "রেজিস্ট্রেশন প্রক্রিয়ায় সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।" },
      { status: 500 }
    );
  }
}
