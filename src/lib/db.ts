import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Tenant-Isolated Transaction Helper (Kernel-Level Row Level Security)
 * Enforces PostgreSQL RLS by setting app.current_tenant_id for the transaction scope.
 */
export async function withTenantContext<T>(
  tenantId: string,
  operation: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    // Strict alphanumeric sanitization to prevent SQL injection in transaction session
    const safeTenantId = tenantId.replace(/[^a-zA-Z0-9_-]/g, "");
    await tx.$executeRawUnsafe(
      `SET LOCAL app.current_tenant_id = '${safeTenantId}';`
    );
    return await operation(tx as unknown as PrismaClient);
  });
}

export default prisma;
