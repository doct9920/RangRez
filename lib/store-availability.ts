import { prisma } from '@/lib/prisma';

/**
 * Whether customers can browse and place new orders.
 * A missing settings row keeps the existing public-store behavior.
 */
export async function isStorePublic(): Promise<boolean> {
  const settings = await prisma.homepageSettings.findUnique({
    where: { id: 'homepage' },
    select: { isPublic: true },
  });

  return settings?.isPublic ?? true;
}

/** Fail closed when availability cannot be checked. */
export async function isStoreAvailableForCustomers(): Promise<boolean> {
  try {
    return await isStorePublic();
  } catch (error) {
    console.error('[store-availability] Could not verify store status:', error);
    return false;
  }
}
