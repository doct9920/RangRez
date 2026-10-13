import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/jwt';
import { requireAdmin } from '@/lib/admin';
import { type Product } from '@/lib/product-types';
import { getProductByIdFromDB, updateProductInDB, deleteProductFromDB } from '@/lib/products-db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    requireAdmin(token);

    // Fetch product from Supabase PostgreSQL
    const product = await getProductByIdFromDB(params.id);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error('Get product error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get product' },
      { status: error.message?.includes('Forbidden') ? 403 : 401 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    requireAdmin(token);

    const body = await request.json();
    
    // Fetch existing product from Supabase PostgreSQL
    const existingProduct = await getProductByIdFromDB(params.id);

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

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

    // Update product - ensure images are preserved and cleaned
    const bodyImages = body.images && Array.isArray(body.images) && body.images.length > 0 
      ? cleanImages(body.images)
      : cleanImages(existingProduct.images || []);
    
    const updatedProduct: Product = {
      ...existingProduct,
      ...body,
      id: params.id, // Ensure ID doesn't change
      price: body.price !== undefined ? Number(body.price) : existingProduct.price,
      compareAtPrice: body.compareAtPrice !== undefined ? Number(body.compareAtPrice) : existingProduct.compareAtPrice,
      inStock: body.sizes?.some((s: any) => s.available && s.stock > 0) ?? existingProduct.inStock,
      // Ensure images array is cleaned of placeholder paths
      images: bodyImages.length > 0 ? bodyImages : existingProduct.images || [],
    };

    const savedProduct = await updateProductInDB(params.id, updatedProduct);
    console.log('[PATCH /api/admin/products/[id]] Updated product in database:', {
      id: savedProduct.id,
      name: savedProduct.name,
      imageCount: savedProduct.images?.length || 0,
    });

    return NextResponse.json({ product: savedProduct });
  } catch (error: any) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update product' },
      { status: error.message?.includes('Forbidden') ? 403 : 401 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    requireAdmin(token);

    // Check if product exists in Supabase PostgreSQL
    const product = await getProductByIdFromDB(params.id);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Delete product from Supabase PostgreSQL
    const deleted = await deleteProductFromDB(params.id);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete product from database' },
        { status: 500 }
      );
    }
    console.log(`[DELETE /api/admin/products/[id]] Deleted product ${params.id} from database`);

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete product' },
      { status: error.message?.includes('Forbidden') ? 403 : 401 }
    );
  }
}

