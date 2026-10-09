
/**
 * Order pricing, computed on the server.
 *
 * Product prices are always read from the database.
 * Standard shipping is calculated using chargeable weight.
 * Air / Express shipping remains fixed at Rs. 175.
 */

import { prisma } from '@/lib/prisma';
import {
  calculateWeightBasedShipping,
  calculateChargeableWeight,
  getPincodeLocation,
} from '@/lib/shipping';

export interface CartLine {
  productId: string;
  quantity: number;
  size?: string;
}

/** A cart line priced from the database, ready to store on an order. */
export interface PricedLine {
  productId: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  size: string;
  quantity: number;
  image: string;
}

export interface PricedOrder {
  subtotal: number;
  shipping: number;
  total: number;
  /** Total in paise, the unit Razorpay works in. */
  amountInPaise: number;
  items: PricedLine[];
}

export async function priceCart(
  lines: CartLine[],
  pincode: string,
  deliveryMethod: 'standard' | 'air' = 'standard'
): Promise<PricedOrder> {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new Error('Cart is empty');
  }

  if (deliveryMethod !== 'standard' && deliveryMethod !== 'air') {
    throw new Error('Invalid delivery method');
  }

  const products = await prisma.product.findMany({
    where: { id: { in: lines.map((line) => line.productId) } },
    select: {
      id: true,
      name: true,
      price: true,
      compareAtPrice: true,
      images: true,
    },
  });

  const byId = new Map(products.map((product) => [product.id, product]));

  let subtotal = 0;
  const items: PricedLine[] = [];

  for (const line of lines) {
    const product = byId.get(line.productId);

    if (!product) {
      throw new Error(`Unknown product: ${line.productId}`);
    }

    const quantity = Math.floor(Number(line.quantity));

    if (!Number.isFinite(quantity) || quantity < 1) {
      throw new Error(`Invalid quantity for product ${line.productId}`);
    }

    const price = Number(product.price);
    subtotal += price * quantity;

    const images = Array.isArray(product.images)
      ? (product.images as string[])
      : [];

    items.push({
      productId: product.id,
      name: product.name,
      price,
      compareAtPrice:
        product.compareAtPrice != null
          ? Number(product.compareAtPrice)
          : undefined,
      size: line.size || 'Default',
      quantity,
      image: images[0] ?? '',
    });
  }

  // Verify the delivery PIN code.
  await getPincodeLocation(pincode);

  // Current weight rule: every clothing item weighs 700 grams.
  const totalQuantity = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const weight = calculateChargeableWeight(totalQuantity);

  let shipping: number;

  if (deliveryMethod === 'air') {
    // Air / Express keeps the existing fixed charge.
    shipping = 175;
  } else {
    shipping = calculateWeightBasedShipping(
      weight.chargeableWeightKg,
      subtotal
    );
  }

  const total = subtotal + shipping;

  return {
    subtotal,
    shipping,
    total,
    amountInPaise: Math.round(total * 100),
    items,
  };
}
