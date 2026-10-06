import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';
import { priceCart } from '@/lib/pricing';
import { notifyOrderPlaced } from '@/lib/notifications';
import { queuePrintJob } from '@/lib/print-jobs';

/**
 * Places an order.
 *
 * Works for guests as well as signed-in customers: guest orders used to live
 * only in the browser's sessionStorage and were lost when the tab closed, so a
 * guest could pay and leave no record. The order row is written here, on the
 * server, before any payment is attempted.
 *
 * Totals are priced from the database, never from the request body.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, shippingAddress, paymentMethod, deliveryMethod } = body as {
      items?: Array<{ productId: string; quantity: number; size?: string }>;
      shippingAddress?: Record<string, string>;
      paymentMethod?: 'razorpay' | 'cod';
      deliveryMethod?: 'standard' | 'air';
    };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }
    if (deliveryMethod !== 'standard' && deliveryMethod !== 'air') {
  return NextResponse.json(
    { error: 'Invalid delivery method' },
    { status: 400 }
  );
}

    const required = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'pincode'];
    const missing = required.filter((field) => !shippingAddress?.[field]?.trim());
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing address fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    const priced = await priceCart(
  items,
  shippingAddress!.pincode,
  deliveryMethod
);

    // A signed-in customer's order is linked to their account; a guest's is
    // matched later by the email they checked out with.
    const payload = verifyToken(getTokenFromRequest(request));
    const userId = payload?.userId ?? null;
    const userEmail = (payload?.email ?? shippingAddress!.email).toLowerCase();

    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        orderId,
        userId,
        userEmail,
        // Confirmed only once payment is verified (or on delivery for COD).
        status: 'pending',
       paymentMethod: paymentMethod!,
        paymentStatus: 'pending',
        subtotal: new Prisma.Decimal(priced.subtotal),
        shipping: new Prisma.Decimal(priced.shipping),
        total: new Prisma.Decimal(priced.total),
        shippingAddress: shippingAddress as Prisma.JsonObject,
        items: {
          create: priced.items.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: new Prisma.Decimal(item.price),
            compareAtPrice:
              item.compareAtPrice !== undefined ? new Prisma.Decimal(item.compareAtPrice) : null,
            size: item.size,
            quantity: item.quantity,
            image: item.image,
          })),
        },
      },
      select: { id: true, orderId: true, total: true },
    });

// Online orders are announced once payment verifies, not here.
if (paymentMethod === 'cod') {
  await notifyOrderPlaced(order.id);
  await queuePrintJob(order.id);
}

    console.log(
      `[orders/place] ${order.orderId} (${paymentMethod}) for ${userEmail}` +
        (userId ? '' : ' [guest]')
    );

    return NextResponse.json({
      orderId: order.orderId,
      subtotal: priced.subtotal,
      shipping: priced.shipping,
      total: priced.total,
    });
  } catch (error: any) {
    console.error('[orders/place] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Could not place the order' },
      { status: 500 }
    );
  }
}
