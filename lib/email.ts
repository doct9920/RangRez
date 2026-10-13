/**
 * Transactional email.
 *
 * Two messages go out when an order is placed: a confirmation to the customer
 * and an alert to the shop. Both are sent from the shop's address, so a
 * customer replying to their confirmation reaches a real inbox.
 *
 * Sending is best effort: an email outage must never fail an order.
 */

import { Resend } from 'resend';
import { contact } from '@/lib/contact';

export interface OrderEmailItem {
  name: string;
  size: string;
  quantity: number;
  price: number;
}

export interface OrderEmailData {
  orderId: string;
  items: OrderEmailItem[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: 'razorpay' | 'cod';
  paymentStatus: string;
  shippingAddress: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
}

const FROM = `Rangrez <${contact.email}>`;

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

const rupees = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function itemRows(items: OrderEmailItem[]): string {
  return items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee;">
            ${escape(item.name)}<br>
            <span style="color:#666;font-size:13px;">Color ${escape(item.size)} &middot; Qty ${item.quantity}</span>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;">
            ${rupees(item.price * item.quantity)}
          </td>
        </tr>`
    )
    .join('');
}

function totalsBlock(order: OrderEmailData): string {
  return `
    <tr><td style="padding:10px 0 2px;">Subtotal</td><td style="padding:10px 0 2px;text-align:right;">${rupees(order.subtotal)}</td></tr>
    <tr><td style="padding:2px 0;">Shipping</td><td style="padding:2px 0;text-align:right;">${
      order.shipping === 0 ? 'Free' : rupees(order.shipping)
    }</td></tr>
    <tr>
      <td style="padding:10px 0 0;font-weight:600;border-top:1px solid #eee;">Total</td>
      <td style="padding:10px 0 0;text-align:right;font-weight:600;border-top:1px solid #eee;">${rupees(order.total)}</td>
    </tr>`;
}

function addressBlock(order: OrderEmailData): string {
  const a = order.shippingAddress;
  return [
    `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim(),
    a.address,
    [a.city, a.state, a.pincode].filter(Boolean).join(', '),
    a.phone ? `Phone: ${a.phone}` : '',
  ]
    .filter(Boolean)
    .map((line) => escape(String(line)))
    .join('<br>');
}

function shell(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f6f6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#171717;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:10px;padding:28px;">
    <div style="font-size:22px;font-weight:700;letter-spacing:1px;">RANGREZ</div>
    <div style="color:#666;font-size:13px;margin-top:2px;">Hand block printed sarees and suits, Rewari</div>
    <h1 style="font-size:19px;margin:24px 0 4px;">${escape(title)}</h1>
    ${body}
    <p style="color:#888;font-size:12px;margin-top:28px;border-top:1px solid #eee;padding-top:14px;">
      Questions? Reply to this email or message us on WhatsApp at ${escape(contact.phone)}.
    </p>
  </div>
</body></html>`;
}

function customerEmail(order: OrderEmailData): string {
  const paymentLine =
    order.paymentMethod === 'cod'
      ? 'Cash on delivery'
      : order.paymentStatus === 'paid'
      ? 'Paid online'
      : 'Payment pending';

  return shell(
    `Thank you for your order`,
    `<p style="color:#444;margin:0 0 18px;">
       Order <strong>${escape(order.orderId)}</strong> is confirmed. We will let you know as soon as it ships.
     </p>
     <table style="width:100%;border-collapse:collapse;font-size:14px;">
       ${itemRows(order.items)}
       ${totalsBlock(order)}
     </table>
     <p style="margin:22px 0 4px;font-weight:600;font-size:14px;">Delivering to</p>
     <p style="margin:0;color:#444;font-size:14px;line-height:1.6;">${addressBlock(order)}</p>
     <p style="margin:18px 0 0;color:#444;font-size:14px;">Payment: ${paymentLine}</p>`
  );
}

function shopEmail(order: OrderEmailData): string {
  const a = order.shippingAddress;
  return shell(
    `New order ${order.orderId}`,
    `<table style="width:100%;border-collapse:collapse;font-size:14px;">
       ${itemRows(order.items)}
       ${totalsBlock(order)}
     </table>
     <p style="margin:22px 0 4px;font-weight:600;font-size:14px;">Customer</p>
     <p style="margin:0;color:#444;font-size:14px;line-height:1.6;">
       ${addressBlock(order)}<br>
       ${a.email ? `Email: ${escape(a.email)}` : ''}
     </p>
     <p style="margin:18px 0 0;color:#444;font-size:14px;">
       Payment: ${escape(order.paymentMethod)} &middot; ${escape(order.paymentStatus)}
     </p>`
  );
}

/**
 * Sends both emails. Never throws: the caller is completing an order.
 * Returns whether anything was sent, so the caller can record it.
 */
export async function sendOrderEmails(order: OrderEmailData): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.warn('[email] RESEND_API_KEY is not set; skipping order emails');
    return false;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const customer = order.shippingAddress.email;

  try {
    const [customerResult, shopResult] = await Promise.all([
      customer
        ? resend.emails.send(
            {
              from: FROM,
              to: customer,
              replyTo: contact.email,
              subject: `Your Rangrez order ${order.orderId}`,
              html: customerEmail(order),
            },
            { idempotencyKey: `rangrez-customer-${order.orderId}` }
          )
        : Promise.resolve(null),
      resend.emails.send(
        {
          from: FROM,
          to: contact.email,
          replyTo: customer || contact.email,
          subject: `New order ${order.orderId} - ${rupees(order.total)}`,
          html: shopEmail(order),
        },
        { idempotencyKey: `rangrez-shop-${order.orderId}` }
      ),
    ]);

    if (customerResult?.error || shopResult.error) {
      console.error('[email] Resend API error:', customerResult?.error, shopResult.error);
      return false;
    }

    console.log(`[email] Sent order emails for ${order.orderId}`);
    return true;
  } catch (error) {
    console.error('[email] Failed to send order emails:', error);
    return false;
  }
}
