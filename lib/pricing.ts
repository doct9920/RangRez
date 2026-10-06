/**
 * Order pricing, computed on the server.
 *
 * Prices must never be taken from the browser: a tampered request could
 * otherwise pay a rupee for a saree. Everything here re-reads the product
 * price from the database and applies the same shipping rule the cart shows.
 */

import { prisma } from '@/lib/prisma';
import {
  calculateShipping,
  getPincodeLocation,
  getPincodeCoordinates,
  calculateDistance,
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

  const products = await prisma.product.findMany({
    where: { id: { in: lines.map((line) => line.productId) } },
    select: { id: true, name: true, price: true, compareAtPrice: true, images: true },
  });

  const byId = new Map(products.map((p) => [p.id, p]));

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

    const images = Array.isArray(product.images) ? (product.images as string[]) : [];
    items.push({
      productId: product.id,
      name: product.name,
      price,
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : undefined,
      size: line.size || 'Default',
      quantity,
      image: images[0] ?? '',
    });
  }

  const location = await getPincodeLocation(pincode);

let shipping: number;

if (deliveryMethod === 'air') {
  shipping = 175;
} else {
  const coordinates = await getPincodeCoordinates(
    location.pincode,
    location.state,
    location.city
  );

  const distance = calculateDistance(
    coordinates.latitude,
    coordinates.longitude
  );

  shipping = calculateShipping(subtotal, distance);
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
