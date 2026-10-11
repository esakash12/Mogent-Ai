import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getOrCreateTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

const DEFAULT_REPLIES = [
  {
    title: "ডেলিভারি চার্জের তথ্য",
    content: "আমাদের ডেলিভারি চার্জ ঢাকার ভেতরে ৬০ টাকা এবং ঢাকার বাইরে ১২০ টাকা।",
    category: "ডেলিভারি",
  },
  {
    title: "ক্যাশ অন ডেলিভারি ও চেকিং",
    content: "আমাদের সব পণ্য ক্যাশ অন ডেলিভারিতে পাবেন। ডেলিভারি ম্যানের সামনে চেক করে রিসিভ করার পূর্ণ সুযোগ রয়েছে।",
    category: "পেমেন্ট",
  },
  {
    title: "অর্ডার করার নিয়ম",
    content: "অর্ডারটি নিশ্চিত করতে অনুগ্রহ করে আপনার নাম, মোবাইল নম্বর এবং সম্পূর্ণ ডেলিভারি ঠিকানা লিখে পাঠান ভাইয়া/আপু।",
    category: "অর্ডার",
  },
  {
    title: "অর্ডার কনফার্মেশন",
    content: "ধন্যবাদ! আপনার অর্ডারটি নিশ্চিত করা হয়েছে। খুব শীঘ্রই আমাদের প্রতিনিধি পার্সেলটি পাঠিয়ে দেবে।",
    category: "অর্ডার",
  },
  {
    title: "স্টক চেক আপডেট",
    content: "জি, এই পণ্যটি বর্তমানে আমাদের স্টকে এভেইলএবল রয়েছে। আপনি কি এটি নিতে চান?",
    category: "পণ্য",
  },
];

export async function GET(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const tenant = await getOrCreateTenant(params.tenant);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const saved = await prisma.savedReply.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
    });

    // If tenant has no custom replies yet, seed or return defaults
    const combinedReplies = [
      ...saved,
      ...DEFAULT_REPLIES.map((d, i) => ({
        id: `default_${i}`,
        tenantId: tenant.id,
        ...d,
        createdAt: new Date().toISOString(),
      })),
    ];

    return NextResponse.json({ success: true, replies: combinedReplies });
  } catch (error) {
    console.error("Fetch saved replies error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const tenant = await getOrCreateTenant(params.tenant);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const body = await request.json();
    const { title, content, category = "General" } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const newReply = await prisma.savedReply.create({
      data: {
        tenantId: tenant.id,
        title,
        content,
        category,
      },
    });

    return NextResponse.json({ success: true, reply: newReply });
  } catch (error) {
    console.error("Create saved reply error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
