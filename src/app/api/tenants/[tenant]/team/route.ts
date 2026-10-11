import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getOrCreateTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const tenant = await getOrCreateTenant(params.tenant);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const teamMembers = await prisma.teamMember.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { createdAt: "asc" },
    });

    const tenantUsers = await prisma.user.findMany({
      where: { tenantId: tenant.id },
      select: { id: true, name: true, email: true, role: true },
    });

    // Formatted list of assignable agents
    const agents = [
      ...tenantUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isUser: true,
      })),
      ...teamMembers.map((tm) => ({
        id: tm.id,
        name: tm.name,
        email: tm.email,
        role: tm.role,
        isUser: false,
      })),
    ];

    // If no specific users found, provide default Admin option
    if (agents.length === 0) {
      agents.push({
        id: "admin_default",
        name: `${tenant.name} Support Team`,
        email: "support@mogent.ai",
        role: "OWNER",
        isUser: true,
      });
    }

    return NextResponse.json({ success: true, agents });
  } catch (error) {
    console.error("Fetch team error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
