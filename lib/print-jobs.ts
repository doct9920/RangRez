import { prisma } from '@/lib/prisma';

export async function queuePrintJob(orderId: string) {
  try {
    return await prisma.printJob.upsert({
      where: {
        orderId,
      },
      create: {
        orderId,
        status: 'pending',
      },
      update: {},
    });
  } catch (error) {
    console.error('[print-jobs] Failed to queue print job:', error);
    return null;
  }
}