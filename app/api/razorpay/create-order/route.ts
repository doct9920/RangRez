import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { priceCart } from '@/lib/pricing';
import { getRazorpay, isRazorpayConfigured } from '@/lib/razorpay-server';
import { isStoreAvailableForCustomers } from '@/lib/store-availability';

/**
 * Creates a Razorpay order for the current cart.
 *
 * The amount is priced from the database, never from the request body, so a
 * tampered cart cannot change what is charged.
 */
export async function POST(request: NextRequest) {
  try {
    if (!(await isStoreAvailableForCustomers())) {
      return NextResponse.json(
        { error: 'The store is temporarily closed. Please try again later.' },
        { status: 503 }
      );
    }

    if (!isRazorpayConfigured()) {
      return NextResponse.json(
        { error: 'Online payment is not available right now.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { items, orderId, pincode, deliveryMethod } = body as {
      items?: Array<{ productId: string; quantity: number }>;
      orderId?: string;
      pincode?: string;
      deliveryMethod?: 'standard' | 'air';
    };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return NextResponse.json({ error: 'A valid 6-digit pincode is required.' }, { status: 400 });
    }

    const priced = await priceCart(
      items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      pincode,
      deliveryMethod === 'air' ? 'air' : 'standard'
    );

    const razorpay = getRazorpay();
    const razorpayOrder = await razorpay.orders.create({
      amount: priced.amountInPaise,
      currency: 'INR',
      // Razorpay caps the receipt at 40 characters.
      receipt: (orderId ?? `rzp_${Date.now()}`).slice(0, 40),
      notes: orderId ? { shopOrderId: orderId } : undefined,
    });

    // Link the Razorpay order to ours when the order row already exists, so
    // the webhook can find it even if the browser never comes back.
    if (orderId) {
      await prisma.order
        .update({
          where: { orderId },
          data: { razorpayOrderId: razorpayOrder.id },
        })
        .catch(() => {
          // Guest checkouts have no order row yet; verification still works.
        });
    }

    return NextResponse.json({
      razorpayOrderId: razorpayOrder.id,
      amount: priced.amountInPaise,
      currency: 'INR',
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      subtotal: priced.subtotal,
      shipping: priced.shipping,
      total: priced.total,
    });
  } catch (error: any) {
    console.error('[razorpay/create-order] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Could not start the payment' },
      { status: 500 }
    );
  }
}
