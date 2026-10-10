import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    // Require a valid signed-in customer token.
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();

    // COD is disabled.
    if (body?.paymentMethod !== 'razorpay') {
      return NextResponse.json(
        { error: 'Only online payment is accepted' },
        { status: 400 }
      );
    }

    // This legacy endpoint accepts no orders: client-provided totals and
    // paymentStatus must never be trusted to create or mark an order as paid.
    // Checkout uses /api/orders/place, and payment is confirmed by the
    // server-side Razorpay verification endpoint.
    return NextResponse.json(
      {
        error:
          'This order endpoint is disabled. Please use the online checkout flow.',
      },
      { status: 410 }
    );
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
