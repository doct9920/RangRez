'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '@/lib/product-types';
import Link from 'next/link';
import Image from 'next/image';
import PlaceholderImage from './PlaceholderImage';

interface SearchBarProps {
  onClose?: () => void;
  mobile?: boolean;
}

export default function SearchBar({ onClose, mobile = false }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      // Phase 4: Search from database via API
      fetch(`/api/products/search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => {
          const results = (data.products || []).slice(0, 5); // Top 5 suggestions
          // Debug: Log first result's image data
          if (results.length > 0) {
            console.log('[SearchBar] First result:', {
              name: results[0].name,
              hasImages: !!results[0].images,
              imageCount: results[0].images?.length || 0,
              firstImage: results[0].images?.[0]?.substring(0, 50) || 'none',
            });
          }
          setSuggestions(results);
          setIsOpen(results.length > 0);
        })
        .catch((error) => {
          console.error('[SearchBar] Search error:', error);
          setSuggestions([]);
          setIsOpen(false);
        });
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleProductClick(suggestions[selectedIndex].id);
      } else if (query.trim()) {
        handleSearch();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
      onClose?.();
    }
  };

  const handleProductClick = (productId: string) => {
    router.push(`/products/${productId}`);
    setIsOpen(false);
    setQuery('');
    onClose?.();
  };

  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      setQuery('');
      onClose?.();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div ref={containerRef} className={`rangrez-searchbar relative ${mobile ? 'w-full' : 'w-full max-w-md'}`}>
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          className={`w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 ${
            mobile ? 'text-base' : 'text-sm'
          }`}
        />
        {/* Search Icon */}
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {/* Clear Button */}
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto"
          >
            {suggestions.map((product, index) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                onClick={() => {
                  handleProductClick(product.id);
                }}
                className={`flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors ${
                  index === selectedIndex ? 'bg-gray-50' : ''
                } ${index !== suggestions.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                {/* Product Image */}
                <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                  {(() => {
                    // Find first valid image (base64 or http/https URL)
                    const allImages = product.images || [];
                    const validImage = allImages.find((img: string) => 
                      img && (img.startsWith('data:') || img.startsWith('http://') || img.startsWith('https://'))
                    );
                    
                    // Debug logging
                    if (index === 0) {
                      console.log('[SearchBar] Product image debug:', {
                        productName: product.name,
                        totalImages: allImages.length,
                        firstImage: allImages[0]?.substring(0, 50) || 'none',
                        foundValidImage: !!validImage,
                        validImagePreview: validImage?.substring(0, 50) || 'none',
                        allImages: allImages.map((img: string) => img?.substring(0, 30) || 'empty'),
                      });
                    }
                    
                    if (validImage) {
                      if (validImage.startsWith('data:')) {
                        // Base64 data URL - use regular img tag
                        return (
                          <img
                            src={validImage}
                            alt={product.name}
                            className="w-full h-full object-cover object-top"
                            onError={(e) => {
                              console.error('[SearchBar] Image load error:', {
                                productName: product.name,
                                imagePreview: validImage.substring(0, 50),
                              });
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                            onLoad={() => {
                              if (index === 0) {
                                console.log('[SearchBar] Image loaded successfully:', product.name);
                              }
                            }}
                          />
                        );
                      } else {
                        // HTTP/HTTPS URL - use Next.js Image
                        return (
                          <Image
                            src={validImage}
                            alt={product.name}
                            fill
                            className="object-cover object-top"
                            sizes="48px"
                            quality={70}
                          />
                        );
                      }
                    }
                    // No valid image found - show placeholder
                    return <PlaceholderImage alt={product.name} />;
                  })()}
                </div>
                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {product.name}
                  </p>
                  <p className="text-sm font-bold text-gray-700">
                    {formatPrice(product.price)}
                  </p>
                </div>
              </Link>
            ))}
            {/* View All Results */}
            {query.trim() && (
              <div className="border-t border-gray-200 p-3 bg-gray-50">
                <button
                  onClick={handleSearch}
                  className="w-full text-center text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors"
                >
                  View all results for &quot;{query}&quot;
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

