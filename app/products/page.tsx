import Link from 'next/link';
import Image from 'next/image';
import { getAllProductsFromDB } from '@/lib/products-db';
import ProductReviewStars from '@/components/ProductReviewStars';

// These pages read products and homepage settings from the database. Without
// this they are prerendered once at build time, so catalogue and image changes
// only appear after a redeploy. Re-render at most once a minute instead.
export const revalidate = 60;

export default async function AllProductsPage() {
  // Fetch all products from database
  const products = await getAllProductsFromDB();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      {/* Page Header */}
      <div className="mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
          All Products
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl">
          Browse our complete collection of premium women&apos;s wear
        </p>
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => {
            // Get first image from product.images array
            const productImage = product.images && product.images.length > 0
              ? product.images[0]
              : null;

            const hasValidImage = productImage && (
              productImage.startsWith('data:') ||
              productImage.startsWith('http://') ||
              productImage.startsWith('https://')
            );

            const discountPercent =
              product.compareAtPrice &&
              product.compareAtPrice > product.price &&
              product.price >= 0
                ? Math.round(
                    ((product.compareAtPrice - product.price) /
                      product.compareAtPrice) * 100
                  )
                : 0;

            return (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group rangrez-product-float"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100 mb-2 group-hover:shadow-lg transition-shadow">
                  {discountPercent > 0 && (
                    <span className="pointer-events-none absolute left-2 top-2 z-20 rounded-md border border-[#E8C77B] bg-[#17130D] px-2 py-1 text-[10px] font-bold text-[#E8C77B] shadow-md sm:text-xs">
                      {discountPercent}% OFF
                    </span>
                  )}
                  {hasValidImage ? (
                    productImage.startsWith('data:') ? (
                      // Base64 data URL - use regular img tag
                      <img
                        src={productImage}
                        alt={product.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      // HTTP/HTTPS URL - use Next.js Image
                      <Image
                        src={productImage}
                        alt={product.name}
                        fill
                        className="object-cover object-top group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        quality={80}
                      />
                    )
                  ) : (
                    // Placeholder for invalid images
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 group-hover:from-gray-300 group-hover:to-gray-400 transition-colors flex items-center justify-center">
                      <span className="text-gray-500 text-sm">Product Image</span>
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-sm md:text-base mb-1 line-clamp-2 group-hover:text-gray-600 transition-colors">
                  {product.name}
                </h3>
                <div className="mb-1">
                  <ProductReviewStars productId={product.id} size="sm" noLink={true} />
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-base md:text-lg font-bold text-[#E8C77B]">
                    {formatPrice(product.price)}
                  </p>
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <p className="text-sm text-[#E8C77B] line-through opacity-75">
                      {formatPrice(product.compareAtPrice)}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No products found.</p>
        </div>
      )}
    </div>
  );
}

