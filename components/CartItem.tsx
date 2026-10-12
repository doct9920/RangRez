'use client';

import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import QuantityControls from './QuantityControls';
import Image from 'next/image';

interface CartItemProps {
  item: {
    id: string;
    productId: string;
    name: string;
    price: number;
    compareAtPrice?: number;
    size: string;
    quantity: number;
    image: string;
  };
}

export default function CartItem({ item }: CartItemProps) {
  const { removeItem, updateQuantity } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const itemTotal = item.price * item.quantity;

  return (
    <div className="rangrez-luxury-cart-item p-4 text-[#F4E9D5] md:p-6">
      <div className="flex gap-4">
        {/* Product Image */}
        <Link
          href={`/products/${item.productId}`}
          className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 overflow-hidden rounded-lg border border-[#80663D] bg-[#242424] transition-opacity hover:opacity-80"
          aria-label={`View ${item.name}`}
        >
          {item.image ? (
            item.image.startsWith('data:') ? (
              // Base64 data URL - use regular img tag
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover object-top"
              />
            ) : item.image.startsWith('http') ? (
              // HTTP/HTTPS URL - use Next.js Image
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 80px, 96px"
                quality={75}
              />
            ) : (
              // Placeholder for invalid images
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <span className="text-gray-400 text-xs">Image</span>
              </div>
            )
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <span className="text-gray-400 text-xs">Image</span>
            </div>
          )}
        </Link>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Link
                href={`/products/${item.productId}`}
                className="mb-1 block text-base font-semibold text-[#D9B978] transition-colors hover:text-[#F0D49A] md:text-lg"
              >
                {item.name}
              </Link>
              <p className="mb-2 text-sm text-[#C5B8A3]">
                Color: <span className="font-medium text-[#F4E9D5]">{item.size}</span>
              </p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-[#D9B978]">{formatPrice(item.price)}</span>
                {item.compareAtPrice && (
                  <span className="text-sm text-[#9B8C77] line-through">
                    {formatPrice(item.compareAtPrice)}
                  </span>
                )}
              </div>
            </div>

            {/* Remove Button */}
            <button
              onClick={() => removeItem(item.id)}
              className="rounded-md p-1 text-[#C5B8A3] transition-colors hover:bg-[#332B20] hover:text-red-400"
              aria-label="Remove item"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Quantity Controls & Total */}
          <div className="flex items-center justify-between mt-4">
            <QuantityControls
              quantity={item.quantity}
              onIncrement={() => updateQuantity(item.id, item.quantity + 1)}
              onDecrement={() => updateQuantity(item.id, item.quantity - 1)}
            />
            <div className="text-right">
              <div className="text-sm font-medium text-[#C5B8A3]">Item Total</div>
              <div className="text-lg font-bold text-[#D9B978]">{formatPrice(itemTotal)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

