
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getAllProductsFromDB,
  getProductsByCollectionFromDB,
} from '@/lib/products-db';
import { prisma } from '@/lib/prisma';
import ProductReviewStars from '@/components/ProductReviewStars';
import ProductImageRotator from '@/components/ProductImageRotator';
import { shopCategories } from '@/lib/categories';

// These pages read products and homepage settings from the database.
// Re-render at most once a minute so catalogue and image changes
// can appear without requiring a redeploy.
export const revalidate = 60;

const collectionInfo: Record<
  string,
  { name: string; description: string }
> = {
  ...Object.fromEntries(
    shopCategories.map((category) => [
      category.slug,
      {
        name: category.name,
        description: category.description,
      },
    ])
  ),
  'new-arrivals': {
    name: 'New Arrivals',
    description: 'Latest additions to our collection',
  },
  sarees: {
    name: 'Sarees',
    description: 'Elegant sarees for every occasion',
  },
  suits: {
    name: 'Suits',
    description: 'Graceful salwar suits and sets',
  },
  kurtis: {
    name: 'Kurtis',
    description: 'Comfortable and stylish kurtis',
  },
  lehengas: {
    name: 'Lehengas',
    description: 'Festive and bridal lehengas',
  },
};

export async function generateStaticParams() {
  const collections = await prisma.collection.findMany({
    select: {
      slug: true,
    },
  });

  const staticSlugs = Object.keys(collectionInfo);

  return Array.from(
    new Set([
      ...staticSlugs,
      ...collections.map((collection) => collection.slug),
    ])
  ).map((slug) => ({
    slug,
  }));
}

export default async function CollectionPage({
  params,
}: {
  params: { slug: string };
}) {
  const dbCollection = await prisma.collection.findUnique({
    where: { slug: params.slug },
  });

  const collectionData = dbCollection
    ? {
        name: dbCollection.name,
        description:
          collectionInfo[params.slug]?.description ||
          `Explore our ${dbCollection.name} collection.`,
      }
    : collectionInfo[params.slug];

  if (!collectionData) {
    notFound();
  }

  // Phase 4: Get products from database by collection.
  // New Arrivals shows the newest products from all collections.
  const products =
    params.slug === 'new-arrivals'
      ? (await getAllProductsFromDB()).slice(0, 24)
      : await getProductsByCollectionFromDB(
          collectionData.name
        );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      {/* Collection Header */}
      <div className="mb-8 md:mb-12">
        <h1 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
          {collectionData.name}
        </h1>

        <p className="max-w-2xl text-lg text-gray-600">
          {collectionData.description}
        </p>
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {products.map((product) => {
            const images = product.images ?? [];

            return (
              <div
                key={product.id}
                className="group min-w-0"
              >
                {/* Product image and thumbnail gallery */}
                <div className="relative mb-3">
                  <ProductImageRotator
                    images={images}
                    name={product.name}
                  />

                  {/* Main photo opens the product page */}
                  <Link
                    href={`/products/${product.id}`}
                    aria-label={`View ${product.name} - ${formatPrice(product.price)}`}
                    className="absolute inset-x-0 top-0 z-10 aspect-[3/4] rounded-lg"
                  />
                </div>

                {/* Product Name */}
                <Link
                  href={`/products/${product.id}`}
                  className="block"
                >
                  <h3 className="mb-1 line-clamp-2 text-sm font-semibold transition-colors group-hover:text-gray-600 md:text-base">
                    {product.name}
                  </h3>
                </Link>

                {/* Product Reviews */}
                <div className="mb-1">
                  <ProductReviewStars
                    productId={product.id}
                    size="sm"
                    noLink={true}
                  />
                </div>

                {/* Product Price */}
                <Link
                  href={`/products/${product.id}`}
                  className="block"
                >
                  <p className="text-base font-bold md:text-lg">
                    {formatPrice(product.price)}
                  </p>
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-lg text-gray-600">
            No products found in this collection.
          </p>
        </div>
      )}
    </div>
  );
}
