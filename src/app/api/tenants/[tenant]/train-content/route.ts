import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { tenant: string } }
) {
  try {
    const { knowledgeBaseText } = await request.json();

    const tenant = await prisma.tenant.findUnique({
      where: { slug: params.tenant },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    await prisma.aiSetting.upsert({
      where: { tenantId: tenant.id },
      update: { knowledgeBaseText },
      create: {
        tenantId: tenant.id,
        knowledgeBaseText,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save train content error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { tenant: string } }
) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const cleanUrl = url.startsWith("http") ? url : `https://${url}`;
    const res = await fetch(cleanUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MogentBot/1.0)" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "ওয়েবসাইট থেকে তথ্য পড়তে সমস্যা হয়েছে।" },
        { status: 400 }
      );
    }

    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const metaDescMatch = html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
    );

    const pageTitle = titleMatch ? titleMatch[1].trim() : cleanUrl;
    const pageDesc = metaDescMatch ? metaDescMatch[1].trim() : "";

    const scrapedSnippet = `--- ${pageTitle} (${cleanUrl}) ---\n${
      pageDesc ? `বিবরণ: ${pageDesc}\n` : ""
    }ওয়েবসাইট লিংক: ${cleanUrl}`;

    return NextResponse.json({ success: true, snippet: scrapedSnippet });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch URL" },
      { status: 500 }
    );
  }
}
