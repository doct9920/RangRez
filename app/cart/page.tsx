'use client';

import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';
import ProgressBar from '@/components/ProgressBar';
import CartItem from '@/components/CartItem';
import CartUpsells from '@/components/CartUpsells';
import TrustBadges from '@/components/TrustBadges';
import { whatsappHref } from '@/lib/contact';

export default function CartPage() {
  const { items, getTotal, getItemCount, clearCart } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const subtotal = getTotal();


  if (items.length === 0) {
    return (
      <div className="rangrez-luxury-cart container mx-auto min-h-screen bg-[#101010] px-4 py-12 text-[#F4E9D5] md:py-16">
        <ProgressBar currentStep="cart" />
        
        <div className="max-w-2xl mx-auto text-center py-16">
          <svg
            className="w-24 h-24 mx-auto text-gray-300 mb-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">
            Looks like you haven&apos;t added anything to your cart yet.
          </p>
          <Link
            href="/collections/new-arrivals"
            className="inline-block px-8 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rangrez-luxury-cart container mx-auto min-h-screen bg-[#101010] px-4 py-6 text-[#F4E9D5] md:py-8">
      <ProgressBar currentStep="cart" />

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">Shopping Cart</h1>
          <span className="text-gray-600">
            {getItemCount()} {getItemCount() === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">


            {/* Cart Items List */}
            <div className="divide-y divide-[#4B4032] rounded-lg border border-[#80663D] bg-[#1B1B1B]">
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>

            {/* Continue Shopping */}
            <Link
              href="/collections/new-arrivals"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Continue Shopping
            </Link>

            {/* Cart Upsells */}
            <CartUpsells />
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 rounded-lg border border-[#80663D] bg-[#1B1B1B] p-6">
              <h2 className="mb-4 text-xl font-bold text-[#D9B978]">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-[#F4E9D5]">
                  <span className="font-medium">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#F4E9D5]">
                  <span className="font-medium">Shipping</span>
                  <span className="text-sm font-medium text-[#D9B978]">
                    Calculated at checkout
                  </span>
                </div>
              </div>

              <div className="mb-6 border-t border-[#80663D] pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-[#F4E9D5]">Subtotal</span>
                  <span className="text-2xl font-bold text-[#D9B978]">{formatPrice(subtotal)}</span>
                </div>
              </div>

              {/* Trust Badges */}
              <TrustBadges />

              {/* Checkout Button */}
              <Link
                href="/checkout"
                className="mb-4 block w-full rounded-lg border border-[#D9B978] bg-[#D9B978] px-6 py-4 text-center font-semibold text-[#101010] transition-colors hover:bg-[#F0D49A]"
              >
                Proceed to Checkout
              </Link>

              {/* WhatsApp Checkout Option */}
              <a
                href={whatsappHref(
                  `Hi! I'd like to place an order:\n\n${items.map(item => `${item.name} (Color: ${item.size}) x${item.quantity} - ${formatPrice(item.price * item.quantity)}`).join('\n')}\n\nSubtotal: ${formatPrice(subtotal)} (shipping calculated at checkout)`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 px-6 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors text-center flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Checkout via WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

