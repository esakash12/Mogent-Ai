import prisma from "@/lib/db";

/**
 * Retrieves a tenant strictly from PostgreSQL by its slug.
 * Zero hardcoded mock users ("MD Burhan") or dummy stores ("asadin").
 * If the tenant does not exist in the database, returns null.
 */
export async function getTenantBySlug(slug: string) {
  if (!slug) return null;

  return await prisma.tenant.findUnique({
    where: { slug: slug.toLowerCase() },
    include: {
      wallet: true,
      aiSetting: true,
      channels: true,
    },
  });
}

/**
 * Retrieves a tenant by ID
 */
export async function getTenantById(id: string) {
  if (!id) return null;

  return await prisma.tenant.findUnique({
    where: { id },
    include: {
      wallet: true,
      aiSetting: true,
      channels: true,
    },
  });
}

/**
 * Safe backward-compatible getter for existing routes.
 * Strictly queries PostgreSQL without pre-seeding fake dummy records.
 */
export async function getOrCreateTenant(slug: string) {
  return await getTenantBySlug(slug);
}
