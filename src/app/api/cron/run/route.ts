import { NextRequest, NextResponse } from "next/server";
import { auditWalletBalancesAndPauseExhausted } from "@/lib/scheduler/billing-cycle";
import { auditAndRefreshExpiringTokens } from "@/lib/scheduler/token-refresh";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET || "mogent-ai-internal-cron-token-2026";
    const authHeader = req.headers.get("authorization");
    const querySecret = req.nextUrl.searchParams.get("secret");

    const isAuthorized =
      authHeader === `Bearer ${cronSecret}` || querySecret === cronSecret;

    if (!isAuthorized) {
      return NextResponse.json({ error: "অননুমোদিত ক্রন এক্সেস (Unauthorized)" }, { status: 401 });
    }

    const walletAudit = await auditWalletBalancesAndPauseExhausted();
    const tokenAudit = await auditAndRefreshExpiringTokens();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      walletAudit,
      tokenAudit,
    });
  } catch (error) {
    console.error("Cron manual trigger error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
