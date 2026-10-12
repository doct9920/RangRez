'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';

interface StickyAddToCartProps {
  product: {
    id: string;
    name: string;
    price: number;
    compareAtPrice?: number;
    sizes: Array<{ value: string; available: boolean; stock: number }>;
    inStock: boolean;
    images?: string[];
  };
}

export default function StickyAddToCart({ product }: StickyAddToCartProps) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showAdded, setShowAdded] = useState(false);
  const pathname = usePathname();
  const { addItem } = useCart();

  useEffect(() => {
    // Show sticky bar after scrolling past initial viewport
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      setIsVisible(scrollY > windowHeight * 0.5);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = () => {
    if (!selectedColor) {
      // Scroll to color selector in main product info
      const colorSelector = document.querySelector('[data-color-selector]');
      if (colorSelector) {
        colorSelector.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Highlight the color selector briefly
        colorSelector.classList.add('ring-2', 'ring-gray-900', 'ring-offset-2');
        setTimeout(() => {
          colorSelector.classList.remove('ring-2', 'ring-gray-900', 'ring-offset-2');
        }, 2000);
      }
      return;
    }
    
    // Add to cart
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      size: selectedColor,
      image: product.images?.[0] || '/placeholder-product.jpg',
    });
    
    setShowAdded(true);
    setTimeout(() => setShowAdded(false), 2000);
  };

  // Only show on product pages
  if (!pathname?.startsWith('/products/')) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="rangrez-luxury-sticky-cart fixed bottom-0 left-0 right-0 z-40 bg-[#101010] border-t border-[#80663d] shadow-lg md:hidden"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{formatPrice(product.price)}</span>
                  {product.compareAtPrice && (
                    <span className="text-sm text-gray-500 line-through">
                      {formatPrice(product.compareAtPrice)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 truncate">{product.name}</p>
              </div>

              {/* Color Selector Dropdown */}
              <select
                value={selectedColor || ''}
                onChange={(e) => setSelectedColor(e.target.value || null)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white text-gray-900"
              >
                <option value="">Color</option>
                {product.sizes
                  .filter((color) => color.available)
                  .map((color) => (
                    <option key={color.value} value={color.value}>
                      {color.value}
                    </option>
                  ))}
              </select>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={product.inStock === false}
                className={`
                  px-6 py-3 rounded-lg font-semibold text-sm whitespace-nowrap transition-all
                  ${
                    !product.inStock
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : showAdded
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-900 text-white hover:bg-gray-800 active:scale-95'
                  }
                `}
              >
                {!product.inStock
                  ? 'Out of Stock'
                  : showAdded
                  ? '✓ Added!'
                  : 'Add to Cart'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

