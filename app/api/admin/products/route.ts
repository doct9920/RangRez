import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/jwt';
import { requireAdmin } from '@/lib/admin';
import { getAllProducts, saveProduct, Product } from '@/lib/products';
import { getAllProductsFromDB, createProductInDB } from '@/lib/products-db';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    requireAdmin(token);

    // Use database if DATABASE_URL is set, otherwise use in-memory store
    const allProducts = process.env.DATABASE_URL
      ? await getAllProductsFromDB()
      : getAllProducts();

    return NextResponse.json({ products: allProducts });
  } catch (error: any) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: error.message?.includes('Forbidden') ? 403 : 401 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    requireAdmin(token);

    const body = await request.json();
    const {
  name,
  price,
  compareAtPrice,
  description,
  images,
  sizes,
  sku,
  collection,
  collections,
  searchKeywords,
} = body;

const selectedCollections: string[] =
  Array.isArray(collections) && collections.length > 0
    ? collections
    : collection
      ? [collection]
      : [];

    // Validation
    if (!name || !price || !description || !sku || selectedCollections.length === 0) {
  return NextResponse.json(
    { error: 'Name, price, description, SKU, and at least one collection are required' },
    { status: 400 }
  );
}

    // Generate ID
    const id = `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Clean up images - filter out placeholder paths
    const cleanImages = (images: string[]): string[] => {
      return images.filter((img: string) => 
        img && (
          img.startsWith('data:') || 
          img.startsWith('http://') || 
          img.startsWith('https://')
        ) && !img.includes('placeholder-product.jpg')
      );
    };

    // Create product
    const product: Product = {
      id,
      name,
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      description,
      images: cleanImages(images || []),
      sizes: sizes || [],
      inStock: sizes?.some((s: any) => s.available && s.stock > 0) || false,
      sku,
      collection: selectedCollections[0],
collections: selectedCollections,
      searchKeywords: searchKeywords || [],
    };

    // Use database if DATABASE_URL is set, otherwise use in-memory store
    let createdProduct: Product;
    if (process.env.DATABASE_URL) {
      createdProduct = await createProductInDB(product);
      console.log('[POST /api/admin/products] Created product in database:', {
        id: createdProduct.id,
        name: createdProduct.name,
        imageCount: createdProduct.images?.length || 0,
      });
    } else {
      saveProduct(product);
      createdProduct = product;
      console.log('[POST /api/admin/products] Created product in memory:', {
        id: product.id,
        name: product.name,
        imageCount: product.images?.length || 0,
      });
    }

    return NextResponse.json({ product: createdProduct }, { status: 201 });
  } catch (error: any) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: error.message?.includes('Forbidden') ? 403 : 401 }
    );
  }
}

