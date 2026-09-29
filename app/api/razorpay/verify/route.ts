import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRazorpay, isValidPaymentSignature } from '@/lib/razorpay-server';
import { notifyOrderPlaced } from '@/lib/notifications';
import { queuePrintJob } from '@/lib/print-jobs';

/**
 * Confirms a checkout callback and marks the order paid.
 *
 * Nothing is trusted from the browser except the three Razorpay fields, and
 * those are only accepted once the signature verifies.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: signature,
      orderId,
    } = body as Record<string, string | undefined>;

    if (!razorpayOrderId || !razorpayPaymentId || !signature) {
      return NextResponse.json(
        { error: 'Missing payment details' },
        { status: 400 }
      );
    }

    const valid = isValidPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      signature,
    });

    if (!valid) {
      console.warn('[razorpay/verify] Rejected an invalid signature', {
        razorpayOrderId,
      });
      return NextResponse.json(
        { error: 'Payment could not be verified' },
        { status: 400 }
      );
    }

    // The order is found by the Razorpay order id recorded when the payment was
    // opened, never by an id supplied here: the signature only proves a payment
    // is genuine for THIS razorpay_order_id, so trusting a caller-supplied order
    // id would let a cheap payment mark an expensive order paid.
    const order = await prisma.order.findUnique({ where: { razorpayOrderId } });

    if (!order) {
      console.warn('[razorpay/verify] No order for razorpay order', razorpayOrderId);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (orderId && orderId !== order.orderId) {
      console.warn('[razorpay/verify] Order id mismatch', {
        claimed: orderId,
        actual: order.orderId,
      });
    }

    // Already settled, most likely by the webhook arriving first.
    if (order.paymentStatus === 'paid') {
      return NextResponse.json({ verified: true, orderUpdated: true, orderId: order.orderId });
    }

    // The signature does not cover the amount, so confirm with Razorpay that
    // the payment was actually captured and for the full total.
    const payment = await getRazorpay().payments.fetch(razorpayPaymentId);
    const expectedPaise = Math.round(Number(order.total) * 100);

    if (payment.order_id !== razorpayOrderId) {
      return NextResponse.json({ error: 'Payment does not belong to this order' }, { status: 400 });
    }
    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return NextResponse.json({ error: `Payment is ${payment.status}` }, { status: 400 });
    }
    if (Number(payment.amount) < expectedPaise) {
      console.error('[razorpay/verify] Underpayment', {
        order: order.orderId,
        paid: payment.amount,
        expected: expectedPaise,
      });
      return NextResponse.json({ error: 'Paid amount does not match the order' }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'paid',
        status: 'confirmed',
        razorpayPaymentId,
      },
    });


    await notifyOrderPlaced(updated.id);
    await queuePrintJob(updated.id);

    return NextResponse.json({
      verified: true,
      orderUpdated: true,
      orderId: updated.orderId,
    });
  } catch (error: any) {
    console.error('[razorpay/verify] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
