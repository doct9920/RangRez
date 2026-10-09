import { NextRequest, NextResponse } from 'next/server';
import {
  calculateChargeableWeight,
  calculateWeightBasedShipping,
  getPincodeLocation,
} from '@/lib/shipping';

type ShippingItem = {
  productId?: string;
  quantity: number;
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pincode = searchParams.get('pincode')?.trim() ?? '';
    const subtotal = Number(searchParams.get('subtotal') ?? 0);
    const rawItems = searchParams.get('items');

    if (!/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        { error: 'Invalid 6-digit PIN code' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(subtotal) || subtotal < 0) {
      return NextResponse.json(
        { error: 'Invalid subtotal' },
        { status: 400 }
      );
    }

    if (!rawItems) {
      return NextResponse.json(
        { error: 'Cart items are required to calculate shipping' },
        { status: 400 }
      );
    }

    let items: ShippingItem[];

    try {
      const parsed: unknown = JSON.parse(rawItems);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Cart items must be a non-empty array');
      }

      items = parsed as ShippingItem[];
    } catch {
      return NextResponse.json(
        { error: 'Invalid cart items' },
        { status: 400 }
      );
    }

    const totalQuantity = items.reduce((sum, item) => {
      const quantity = Number(item?.quantity);

      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new Error('Invalid item quantity');
      }

      return sum + quantity;
    }, 0);

    // Each clothing item currently uses the existing 700 g assumption.
    const weight = calculateChargeableWeight(totalQuantity);
    const shipping = calculateWeightBasedShipping(
      weight.chargeableWeightKg,
      subtotal
    );

    // Validate the destination PIN code and return its location.
    const location = await getPincodeLocation(pincode);

    return NextResponse.json({
      pincode: location.pincode,
      city: location.city,
      state: location.state,
      actualWeightGrams: weight.actualWeightGrams,
      chargeableWeightKg: weight.chargeableWeightKg,
      shipping,
    });
  } catch (error) {
    console.error('Shipping calculation error:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to calculate shipping',
      },
      { status: 500 }
    );
  }
}
