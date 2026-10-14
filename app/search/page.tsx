'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/product-types';
import { sortProducts, SortOption } from '@/lib/search';
import PlaceholderImage from '@/components/PlaceholderImage';
import SearchBar from '@/components/SearchBar';

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const collectionFilter = searchParams.get('collection') || '';
  const sortParam = searchParams.get('sort') || 'relevance';

  const [results, setResults] = useState<Product[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>(sortParam as SortOption);
  const [filters, setFilters] = useState<{
    collection?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
  }>({
    collection: collectionFilter,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    inStock: searchParams.get('inStock') === 'true' ? true : undefined,
  });

  // Phase 4: Fetch collections from API
  const [collections, setCollections] = useState<string[]>([]);

  useEffect(() => {
    // Fetch collections
    fetch('/api/products/collections')
      .then((res) => res.json())
      .then((data) => setCollections(data.collections || []))
      .catch(() => setCollections([]));
  }, []);

  useEffect(() => {
    // Phase 4: Search products from database via API
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filters.collection) params.set('collection', filters.collection);
    if (filters.minPrice) params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString());
    if (filters.inStock) params.set('inStock', 'true');

    fetch(`/api/products/search?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        const sorted = sortProducts(data.products || [], sortBy);
        setResults(sorted);
      })
      .catch((error) => {
        console.error('Search error:', error);
        setResults([]);
      });
  }, [query, filters, sortBy]);

  const handleFilterChange = (key: string, value: string | number | boolean | undefined) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update URL
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (newFilters.collection) params.set('collection', newFilters.collection);
    if (newFilters.minPrice) params.set('minPrice', newFilters.minPrice.toString());
    if (newFilters.maxPrice) params.set('maxPrice', newFilters.maxPrice.toString());
    if (newFilters.inStock) params.set('inStock', 'true');
    if (sortBy !== 'relevance') params.set('sort', sortBy);
    
    router.push(`/search?${params.toString()}`);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    const params = new URLSearchParams(searchParams.toString());
    if (newSort === 'relevance') {
      params.delete('sort');
    } else {
      params.set('sort', newSort);
    }
    router.push(`/search?${params.toString()}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const clearFilters = () => {
    setFilters({
      collection: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      inStock: undefined,
    });
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    router.push(`/search?${params.toString()}`);
  };

  const hasActiveFilters = filters.collection || filters.minPrice || filters.maxPrice || filters.inStock;

  return (
    <div className="rangrez-luxury-search container mx-auto px-4 py-6 md:py-8">
      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar />
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          {query ? `Search Results for "${query}"` : 'All Products'}
        </h1>
        <p className="text-gray-600">
          {results.length} {results.length === 1 ? 'product' : 'products'} found
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-4 sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Collection Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collection
              </label>
              <select
                value={filters.collection || ''}
                onChange={(e) => handleFilterChange('collection', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 text-sm"
              >
                <option value="">All Collections</option>
                {collections.map((collection) => (
                  <option key={collection} value={collection}>
                    {collection}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range
              </label>
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice || ''}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 text-sm"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice || ''}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 text-sm"
                />
              </div>
            </div>

            {/* In Stock Filter */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.inStock === true}
                  onChange={(e) => handleFilterChange('inStock', e.target.checked ? true : undefined)}
                  className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                />
                <span className="text-sm text-gray-700">In Stock Only</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="lg:col-span-3">
          {/* Sort */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-[#D4AF37]">
              Showing {results.length} {results.length === 1 ? 'product' : 'products'}
            </p>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 text-sm"
            >
              <option value="relevance">Relevance</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>

          {/* Products Grid */}
          {results.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="group rangrez-product-float"
                  aria-label={`View ${product.name} - ${formatPrice(product.price)}`}
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 mb-3">
                    {product.compareAtPrice &&
                     product.compareAtPrice > product.price &&
                     product.price >= 0 && (
                      <span className="pointer-events-none absolute left-2 top-2 z-20 rounded-md border border-[#E8C77B] bg-[#17130D] px-2 py-1 text-xs font-bold text-[#E8C77B] shadow-md">
                        {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}% OFF
                      </span>
                    )}
                    {product.images[0] ? (
                      product.images[0].startsWith('data:') ? (
                        // Base64 data URL - use regular img tag
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : product.images[0].startsWith('http') ? (
                        // HTTP/HTTPS URL - use Next.js Image
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover object-top group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                          quality={80}
                        />
                      ) : (
                        // Placeholder for invalid images
                        <PlaceholderImage alt={product.name} />
                      )
                    ) : (
                      <PlaceholderImage alt={product.name} />
                    )}
                  </div>
                  <h3 className="font-semibold text-sm md:text-base mb-1 line-clamp-2 group-hover:text-gray-600 transition-colors text-gray-900">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <p className="text-base md:text-lg font-bold text-gray-900">
                      {formatPrice(product.price)}
                    </p>
                    {product.compareAtPrice && (
                      <p className="text-sm text-gray-500 line-through">
                        {formatPrice(product.compareAtPrice)}
                      </p>
                    )}
                  </div>
                  {!product.inStock && (
                    <p className="text-xs text-red-600 mt-1">Out of Stock</p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto text-gray-400 mb-4"
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
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">
                {query ? `Try adjusting your search or filters` : 'Browse our collections'}
              </p>
              <Link
                href="/collections/new-arrivals"
                className="inline-block px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
              >
                Browse Collections
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-gray-600">Loading search results...</p>
        </div>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
