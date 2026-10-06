import { NextRequest, NextResponse } from 'next/server';
import {
  getPincodeLocation,
  getPincodeCoordinates,
  calculateDistance,
  calculateShipping,
} from '@/lib/shipping';

export async function GET(request: NextRequest) {
  try {
    const pincode = request.nextUrl.searchParams.get('pincode')?.trim();
    const subtotal = Number(
  request.nextUrl.searchParams.get('subtotal') || 0
);
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        { error: 'Invalid 6-digit PIN code' },
        { status: 400 }
      );
    }

    const location = await getPincodeLocation(pincode);

    const coordinates = await getPincodeCoordinates(
      location.pincode,
      location.state,
      location.city
    );

    const distance = calculateDistance(
      coordinates.latitude,
      coordinates.longitude
    );

    const shipping = calculateShipping(subtotal, distance);

    return NextResponse.json({
      pincode: location.pincode,
      city: location.city,
      state: location.state,
      distance: Math.round(distance),
      shipping,
    });
  } catch (error) {
    console.error('Shipping calculation error:', error);

    return NextResponse.json(
      { error: 'Unable to calculate shipping' },
      { status: 500 }
    );
  }
}