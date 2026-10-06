// Razorpay checkout helpers (browser side).
//
// Order creation and payment verification both happen on the server - see
// app/api/razorpay/* - because they need the key secret and must price the
// cart from the database rather than from whatever the browser reports.

export interface RazorpayOptions {
  key: string;
  amount: number; // in paise
  currency: string;
  name: string;
  description: string;
  order_id?: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const loadRazorpayScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay script'));
    document.body.appendChild(script);
  });
};

export interface CreatedRazorpayOrder {
  razorpayOrderId: string;
  amount: number; // paise
  currency: string;
  keyId: string;
}

/** Asks the server to open a Razorpay order for the given cart. */
export const createRazorpayOrder = async (
  items: Array<{ productId: string; quantity: number }>,
  orderId?: string,
  pincode?: string,
  deliveryMethod?: 'standard' | 'air'
): Promise<CreatedRazorpayOrder> => {
  const response = await fetch('/api/razorpay/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
  items,
  orderId,
  shippingAddress: {
    pincode,
  },
  deliveryMethod,
}),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Could not start the payment');
  }
  return data;
};

/**
 * Hands the checkout callback to the server, which checks the signature before
 * marking anything paid. A payment is only real once this resolves.
 */
export const verifyRazorpayPayment = async (
  response: RazorpayResponse,
  orderId?: string
): Promise<void> => {
  const result = await fetch('/api/razorpay/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...response, orderId }),
  });

  const data = await result.json().catch(() => ({}));
  if (!result.ok || !data.verified) {
    throw new Error(data.error || 'Payment could not be verified');
  }
};

export const initiateRazorpayPayment = async (
  options: RazorpayOptions
): Promise<void> => {
  await loadRazorpayScript();

  if (!window.Razorpay) {
    throw new Error('Razorpay SDK not loaded');
  }

  const razorpay = new window.Razorpay(options);

  razorpay.on('payment.failed', (response: any) => {
    console.error('Payment failed:', response);
    throw new Error('Payment failed');
  });

  razorpay.open();
};

