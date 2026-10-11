import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED_HOSTNAME_PATTERNS = [
  /(^|\.)fbcdn\.net$/i,
  /(^|\.)facebook\.com$/i,
  /(^|\.)cdninstagram\.com$/i,
  /(^|\.)whatsapp\.net$/i,
  /(^|\.)amazonaws\.com$/i,
  /(^|\.)r2\.cloudflarestorage\.com$/i,
  /(^|\.)supabase\.co$/i,
  /(^|\.)cloudinary\.com$/i,
  /(^|\.)googleusercontent\.com$/i,
];

function isSafeMediaUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block loopback, link-local, cloud metadata, and private IPv4 ranges
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "169.254.169.254" ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
      hostname === "::1" ||
      hostname.startsWith("fe80:")
    ) {
      return false;
    }

    // Must match authorized CDN / media domains
    return ALLOWED_HOSTNAME_PATTERNS.some((pattern) => pattern.test(hostname));
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  if (!isSafeMediaUrl(url)) {
    return new NextResponse("Forbidden: Target URL is not an authorized media host", { status: 403 });
  }

  try {
    const upstreamRes = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });

    if (!upstreamRes.ok) {
      return new NextResponse(`Upstream failed: ${upstreamRes.statusText}`, {
        status: upstreamRes.status,
      });
    }

    const arrayBuffer = await upstreamRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const totalLength = buffer.length;

    // Detect true media type from header or magic bytes
    let contentType = upstreamRes.headers.get("content-type") || "audio/mp4";
    if (buffer.length > 8 && buffer.subarray(4, 8).toString("ascii") === "ftyp") {
      contentType = "audio/mp4";
    }

    const rangeHeader = request.headers.get("range");
    if (rangeHeader && rangeHeader.startsWith("bytes=")) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10) || 0;
      const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;

      if (start >= totalLength || end >= totalLength || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            "Content-Range": `bytes */${totalLength}`,
          },
        });
      }

      const chunk = buffer.subarray(start, end + 1);
      return new NextResponse(chunk, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${totalLength}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunk.length.toString(),
          "Content-Type": contentType,
          "Content-Disposition": "inline",
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      });
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": totalLength.toString(),
        "Content-Disposition": "inline",
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error: any) {
    console.error("[MEDIA PROXY ERROR]", error);
    return new NextResponse(error.message || "Proxy error", { status: 500 });
  }
}
