import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';
import { priceCart } from '@/lib/pricing';

/**
 * Places a pending order for an online payment.
 *
 * The order row is written on the server before the Razorpay payment attempt,
 * so guest orders are not lost if the browser tab closes. The order is only
 * confirmed after the payment is verified by the server.
 *
 * Totals are priced from the database, never from the request body.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { items, shippingAddress, paymentMethod, deliveryMethod } = body as {
      items?: Array<{ productId: string; quantity: number; size?: string }>;
      shippingAddress?: Record<string, string>;
      paymentMethod?: string;
      deliveryMethod?: 'standard' | 'air';
    };

    // Cash on Delivery is disabled. Accept online payments only.
    if (paymentMethod !== 'razorpay') {
      return NextResponse.json(
        { error: 'Only online payment is accepted' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    if (deliveryMethod !== 'standard' && deliveryMethod !== 'air') {
      return NextResponse.json(
        { error: 'Invalid delivery method' },
        { status: 400 }
      );
    }

    const required = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'address',
      'city',
      'state',
      'pincode',
    ];

    const missing = required.filter(
      (field) => !shippingAddress?.[field]?.trim()
    );

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

    // Link signed-in customers to their account; guests are matched by email.
    const payload = verifyToken(getTokenFromRequest(request));
    const userId = payload?.userId ?? null;
    const userEmail = (payload?.email ?? shippingAddress!.email).toLowerCase();

    const orderId = `ORD-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 11)
      .toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        orderId,
        userId,
        userEmail,
        status: 'pending',
        paymentMethod: 'razorpay',
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
              item.compareAtPrice !== undefined
                ? new Prisma.Decimal(item.compareAtPrice)
                : null,
            size: item.size,
            quantity: item.quantity,
            image: item.image,
          })),
        },
      },
      select: { id: true, orderId: true, total: true },
    });

    console.log(
      `[orders/place] ${order.orderId} (razorpay) for ${userEmail}` +
        (userId ? '' : ' [guest]')
    );

    return NextResponse.json({
      orderId: order.orderId,
      subtotal: priced.subtotal,
      shipping: priced.shipping,
      total: priced.total,
    });
  } catch (error: unknown) {
    console.error('[orders/place] Error:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not place the order',
      },
      { status: 500 }
    );
  }
}
