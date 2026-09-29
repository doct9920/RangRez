import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const token = request.headers.get('x-print-connector-token');

  if (!process.env.PRINT_CONNECTOR_TOKEN || token !== process.env.PRINT_CONNECTOR_TOKEN) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const job = await prisma.$transaction(async (tx) => {
      const pendingJob = await tx.printJob.findFirst({
        where: {
          status: 'pending',
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (!pendingJob) {
        return null;
      }

      const claimed = await tx.printJob.updateMany({
        where: {
          id: pendingJob.id,
          status: 'pending',
        },
        data: {
          status: 'printing',
          attempts: {
            increment: 1,
          },
        },
      });

      if (claimed.count !== 1) {
        return null;
      }

      return tx.printJob.findUnique({
        where: {
          id: pendingJob.id,
        },
        include: {
          order: true,
        },
      });
    });

    if (!job) {
      return NextResponse.json({ job: null });
    }

    return NextResponse.json({
      job: {
        id: job.id,
        orderId: job.orderId,
        status: job.status,
        order: {
          shippingAddress: job.order.shippingAddress,
        },
      },
    });
  } catch (error) {
    console.error('[print-jobs/claim] Error:', error);

    return NextResponse.json(
      { error: 'Failed to claim print job' },
      { status: 500 }
    );
  }
}