import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const token = request.headers.get('x-print-connector-token');

  if (
    !process.env.PRINT_CONNECTOR_TOKEN ||
    token !== process.env.PRINT_CONNECTOR_TOKEN
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { jobId, success, error } = body;

    if (!jobId || typeof success !== 'boolean') {
      return NextResponse.json(
        { error: 'jobId and success are required' },
        { status: 400 }
      );
    }

    if (success) {
      const job = await prisma.printJob.updateMany({
        where: {
          id: jobId,
          status: 'printing',
        },
        data: {
          status: 'printed',
          printedAt: new Date(),
          error: null,
        },
      });

      if (job.count !== 1) {
        return NextResponse.json(
          { error: 'Print job not found or already completed' },
          { status: 409 }
        );
      }

      return NextResponse.json({ success: true });
    }

    const job = await prisma.printJob.updateMany({
      where: {
        id: jobId,
        status: 'printing',
      },
      data: {
        status: 'failed',
        error:
          typeof error === 'string'
            ? error
            : 'Printing failed',
      },
    });

    if (job.count !== 1) {
      return NextResponse.json(
        { error: 'Print job not found or already completed' },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[print-jobs/complete] Error:', error);

    return NextResponse.json(
      { error: 'Failed to update print job' },
      { status: 500 }
    );
  }
}