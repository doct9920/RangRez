import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidWebhookSignature } from '@/lib/razorpay-server';
import { notifyOrderPlaced } from '@/lib/notifications';
import { queuePrintJob } from '@/lib/print-jobs';

/**
 * Razorpay webhook.
 *
 * The browser callback can be lost - a closed tab, a dead connection - so this
 * is the reliable record of a captured payment. Configure it in the Razorpay
 * dashboard against /api/razorpay/webhook for the payment.captured event.
 */
export async function POST(request: NextRequest) {
  try {
    // The signature covers the exact bytes sent, so read the body as text.
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature') ?? '';

    if (!isValidWebhookSignature(rawBody, signature)) {
      console.warn('[razorpay/webhook] Rejected an invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    const payment = event?.payload?.payment?.entity;
    const razorpayOrderId: string | undefined = payment?.order_id;
    const razorpayPaymentId: string | undefined = payment?.id;

    if (razorpayOrderId && razorpayPaymentId) {
      if (event.event === 'payment.captured') {
        const paid = await prisma.order
          .update({
            where: { razorpayOrderId },
            data: { paymentStatus: 'paid', status: 'confirmed', razorpayPaymentId },
          })
          .catch(() => {
            console.warn('[razorpay/webhook] No order matched', razorpayOrderId);
            return null;
          });

        if (paid) {
  await notifyOrderPlaced(paid.id);
  await queuePrintJob(paid.id);
}
      } else if (event.event === 'payment.failed') {
        // Record the failure so the order is not left pending forever.
        await prisma.order
          .update({
            where: { razorpayOrderId },
            data: { paymentStatus: 'failed', razorpayPaymentId },
          })
          .catch(() => {
            console.warn('[razorpay/webhook] No order matched', razorpayOrderId);
          });
      }
    }

    // Always acknowledge, otherwise Razorpay keeps retrying.
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[razorpay/webhook] Error:', error);
    return NextResponse.json({ received: true });
  }
}
