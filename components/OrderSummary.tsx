'use client';

import { CartItem } from '@/contexts/CartContext';
import Link from 'next/link';

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
}

export default function OrderSummary({ items, subtotal, shipping, total }: OrderSummaryProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="rangrez-luxury-order-summary sticky top-20 rounded-lg border border-[#80663D] bg-[#1B1B1B] p-6 text-[#F4E9D5]">
      <h2 className="mb-4 text-xl font-bold text-[#D9B978]">Order Summary</h2>

      {/* Order Items */}
      <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 text-sm">
            <div className="relative w-12 h-12 flex-shrink-0 rounded bg-gray-100">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-gray-400 text-xs">Img</span>
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium text-[#F4E9D5]">{item.name}</p>
              <p className="text-xs text-[#C5B8A3]">
                Color: {item.size} x {item.quantity}
              </p>
            </div>
            <p className="font-semibold text-[#F4E9D5]">{formatPrice(item.price * item.quantity)}</p>
          </div>
        ))}
      </div>

      {/* Price Breakdown */}
      <div className="mb-6 space-y-3 border-t border-[#80663D] pt-4">
        <div className="flex justify-between text-[#F4E9D5]">
          <span className="font-medium">Subtotal</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-[#F4E9D5]">
          <span className="font-medium">Shipping</span>
          <span>
            {shipping === 0 ? (
              <span className="text-sm font-medium text-[#D9B978]">
                Calculated at checkout
              </span>
            ) : (
              <span className="font-medium">{formatPrice(shipping)}</span>
            )}
          </span>
        </div>
      </div>

      {/* Total */}
      <div className="mb-6 border-t border-[#80663D] pt-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-[#F4E9D5]">Total</span>
          <span className="text-2xl font-bold text-[#D9B978]">{formatPrice(total)}</span>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="space-y-2 border-t border-[#80663D] pt-4">
        <div className="flex items-center gap-2 text-xs text-[#C5B8A3]">
          <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Secure checkout</span>
        </div>

      </div>

      {/* Back to Cart */}
      <Link
        href="/cart"
        className="mt-4 block text-center text-sm text-[#D9B978] transition-colors hover:text-[#F0D49A]"
      >
        ← Back to Cart
      </Link>
    </div>
  );
}

