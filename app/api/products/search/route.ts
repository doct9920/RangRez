/**
 * Product Search API
 * 
 * GET /api/products/search?q=query&collection=...
 * 
 * Phase 4: Read Integration - Search products from database
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchProductsFromDB, getAllProductsFromDB } from '@/lib/products-db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const collection = searchParams.get('collection') || undefined;
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
    const inStock = searchParams.get('inStock') === 'true' ? true : undefined;

    let products;

    if (query.trim()) {
      // Search with query
      products = await searchProductsFromDB(query);
    } else {
      // Get all products
      products = await getAllProductsFromDB();
    }

    // Apply filters
    if (collection) {
      products = products.filter(
  (p) => p.collection === collection || p.collections?.includes(collection)
);
    }
    if (minPrice !== undefined) {
      products = products.filter((p) => p.price >= minPrice);
    }
    if (maxPrice !== undefined) {
      products = products.filter((p) => p.price <= maxPrice);
    }
    if (inStock !== undefined) {
      products = products.filter((p) => p.inStock === inStock);
    }

    return NextResponse.json({
      products,
      total: products.length,
      query: query || '',
    });
  } catch (error: any) {
    console.error('[API /products/search] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search products' },
      { status: 500 }
    );
  }
}

