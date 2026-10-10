import { notFound } from 'next/navigation';
import ImageGallery from '@/components/ImageGallery';
import ProductInfo from '@/components/ProductInfo';
import StickyAddToCart from '@/components/StickyAddToCart';
import ProductViewTracker from '@/components/ProductViewTracker';
import ProductReviews from '@/components/ProductReviews';
import ProductCarousel from '@/components/ProductCarousel';
import { getProductByIdFromDB, getAllProductIdsFromDB, getAllProductsFromDB } from '@/lib/products-db';

export const revalidate = 60;

export async function generateStaticParams() {
  const productIds = await getAllProductIdsFromDB();

  return productIds.map((id) => ({
    id,
  }));
}

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await getProductByIdFromDB(params.id);

  if (!product) {
    notFound();
  }

  // Find other products from the same collection(s).
  // If there are not enough, show other available products.
  const allProducts = await getAllProductsFromDB();

  const currentCollections = new Set(
    [product.collection, ...(product.collections || [])]
      .filter(Boolean)
      .map((collection) => collection.trim().toLowerCase())
  );

  const otherProducts = allProducts.filter(
    (item) => item.id !== product.id && item.inStock
  );

  const sameCollectionProducts = otherProducts.filter((item) => {
    const itemCollections = [
      item.collection,
      ...(item.collections || []),
    ]
      .filter(Boolean)
      .map((collection) => collection.trim().toLowerCase());

    return itemCollections.some((collection) =>
      currentCollections.has(collection)
    );
  });

  const recommendedProducts = (
    sameCollectionProducts.length > 0
      ? [
          ...sameCollectionProducts,
          ...otherProducts.filter(
            (item) => !sameCollectionProducts.some(
              (related) => related.id === item.id
            )
          ),
        ]
      : otherProducts
  ).slice(0, 12);

  return (
    <>
      <ProductViewTracker product={product} />

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <ImageGallery
              images={product.images}
              productName={product.name}
            />
          </div>

          {/* Product Information and Add to Cart */}
          <div>
            <ProductInfo product={product} />
          </div>
        </div>
      </div>

      {/* Product Reviews */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        <ProductReviews productId={product.id} />
      </div>

      {/* You May Also Like - Mobile and Desktop */}
      {recommendedProducts.length > 0 && (
        <section className="container mx-auto px-4 py-8 md:py-12">
          <div className="mb-5 md:mb-7">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7b1f2b]">
              Discover More
            </p>

            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">
              You May Also Like
            </h2>

            <p className="mt-2 text-sm text-gray-600 md:text-base">
              Explore more styles from Rangrez.
            </p>
          </div>

          <ProductCarousel
            products={recommendedProducts}
            viewAllHref="/collections/new-arrivals"
          />
        </section>
      )}

      {/* Existing Sticky Add to Cart */}
      <StickyAddToCart product={product} />
    </>
  );
}
