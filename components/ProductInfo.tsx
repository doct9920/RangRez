'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ColorSelector from './ColorSelector';
import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import StarRating from './StarRating';

interface ProductInfoProps {
  product: {
    id: string;
    name: string;
    price: number;
    compareAtPrice?: number;
    description: string;
    sizes: Array<{ value: string; available: boolean; stock: number }>;
    inStock: boolean;
    sku: string;
    collection: string;
    images?: string[];
  };
}

export default function ProductInfo({ product }: ProductInfoProps) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [showAddedToCart, setShowAddedToCart] = useState(false);
  const [reviewStats, setReviewStats] = useState<{ averageRating: number; totalReviews: number } | null>(null);
  const { addItem } = useCart();
  const router = useRouter();

  // Fetch review stats
  useEffect(() => {
    const fetchReviewStats = async () => {
      try {
        const response = await fetch(`/api/reviews?productId=${product.id}&includeStats=true`);
        if (response.ok) {
          const data = await response.json();
          if (data.stats) {
            setReviewStats({
              averageRating: data.stats.averageRating || 0,
              totalReviews: data.stats.totalReviews || 0,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching review stats:', error);
      }
    };

    fetchReviewStats();
  }, [product.id]);

  const scrollToReviews = () => {
    const reviewsSection = document.getElementById('product-reviews');
    if (reviewsSection) {
      reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  /** Puts the item in the cart, or nudges the color selector. Returns whether it went in. */
  const putInCart = (): boolean => {
    if (!selectedColor) {
      const colorSelector = document.querySelector('[data-color-selector]');
      if (colorSelector) {
        colorSelector.scrollIntoView({ behavior: 'smooth', block: 'center' });
        colorSelector.classList.add('ring-2', 'ring-gray-900', 'ring-offset-2');
        setTimeout(() => {
          colorSelector.classList.remove('ring-2', 'ring-gray-900', 'ring-offset-2');
        }, 2000);
      }
      return false;
    }

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      size: selectedColor,
      image: product.images?.[0] || '/placeholder-product.jpg',
    });
    return true;
  };

  const handleAddToCart = () => {
    if (!putInCart()) return;
    setShowAddedToCart(true);
    setTimeout(() => setShowAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    if (!putInCart()) return;
    router.push('/checkout');
  };

  const lowStockColors = product.sizes.filter((color) => color.available && color.stock <= 3 && color.stock > 0);
  const hasLowStock = lowStockColors.length > 0;

  return (
    <div className="space-y-6">
      {/* Collection Badge */}
      <div className="text-sm text-gray-600 uppercase tracking-wide">
        {product.collection}
      </div>

      {/* Product Title */}
      <h1 className="text-3xl md:text-4xl font-bold">{product.name}</h1>

      {/* Review Stars */}
      {reviewStats && reviewStats.totalReviews > 0 && (
        <div
          onClick={scrollToReviews}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              scrollToReviews();
            }
          }}
          className="flex items-center gap-2 group hover:opacity-80 transition-opacity cursor-pointer"
          aria-label={`${reviewStats.averageRating.toFixed(1)} out of 5 stars, ${reviewStats.totalReviews} reviews. Click to view reviews.`}
        >
          <StarRating
            rating={reviewStats.averageRating}
            size="md"
            showValue={true}
          />
          <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
            ({reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? 'review' : 'reviews'})
          </span>
        </div>
      )}

      {/* Price & Discount */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl md:text-4xl font-bold">{formatPrice(product.price)}</span>
        {product.compareAtPrice && (
          <>
            <span className="text-xl text-gray-500 line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
            <span className="px-2 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded">
              {discount}% OFF
            </span>
          </>
        )}
      </div>

      {/* Scarcity Text */}
      {hasLowStock && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-orange-600 text-sm font-medium"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>Only {lowStockColors.map(c => `${c.stock} left in ${c.value}`).join(', ')}</span>
        </motion.div>
      )}

      {/* Description */}
      <div className="prose max-w-none">
        <p className="text-gray-700 leading-relaxed">{product.description}</p>
      </div>

      {/* Color Selector */}
      <div data-color-selector>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold">Color</label>
        </div>
        <ColorSelector
          colors={product.sizes}
          selectedColor={selectedColor}
          onColorSelect={setSelectedColor}
        />
      </div>

      {/* Add to Cart Button */}
      <div className="space-y-3">
        <button
          onClick={handleAddToCart}
          disabled={!selectedColor || !product.inStock}
          className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
            !selectedColor || !product.inStock
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gray-900 text-white hover:bg-gray-800 active:scale-95'
          }`}
        >
          {!selectedColor
            ? 'Select a Color'
            : !product.inStock
            ? 'Out of Stock'
            : showAddedToCart
            ? '✓ Added to Cart!'
            : 'Add to Cart'}
        </button>

        <button
          onClick={handleBuyNow}
          disabled={!selectedColor || !product.inStock}
          className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all border-2 ${
            !selectedColor || !product.inStock
              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
              : 'border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white active:scale-95'
          }`}
        >
          Buy Now
        </button>

        {/* Risk Reversal */}
        <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Free Shipping</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Easy Returns</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>
      {/* Product Details */}
      <div className="border-t border-gray-200 pt-6 space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">SKU:</span>
          <span className="font-medium">{product.sku}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Availability:</span>
          <span className={`font-medium ${product.inStock ? 'text-green-600' : 'text-red-600'}`}>
            {product.inStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>
      </div>
    </div>
  );
}

