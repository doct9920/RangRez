import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const token = request.headers.get('x-print-connector-token');

  if (!process.env.PRINT_CONNECTOR_TOKEN || token !== process.env.PRINT_CONNECTOR_TOKEN) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const job = await prisma.printJob.findFirst({
      where: {
        status: 'pending',
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        order: true,
      },
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
    console.error('[print-jobs/pending] Error:', error);

    return NextResponse.json(
      { error: 'Failed to fetch print job' },
      { status: 500 }
    );
  }
}