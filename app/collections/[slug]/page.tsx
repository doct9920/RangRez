import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getAllProductsFromDB, getProductsByCollectionFromDB } from '@/lib/products-db';
import { prisma } from '@/lib/prisma';
import ProductReviewStars from '@/components/ProductReviewStars';
import { shopCategories } from '@/lib/categories';

// These pages read products and homepage settings from the database. Without
// this they are prerendered once at build time, so catalogue and image changes
// only appear after a redeploy. Re-render at most once a minute instead.
export const revalidate = 60;

const collectionInfo: Record<string, { name: string; description: string }> = {
  ...Object.fromEntries(
    shopCategories.map((category) => [
      category.slug,
      { name: category.name, description: category.description },
    ])
  ),
  'new-arrivals': {
    name: 'New Arrivals',
    description: 'Latest additions to our collection',
  },
  'sarees': {
    name: 'Sarees',
    description: 'Elegant sarees for every occasion',
  },
  'suits': {
    name: 'Suits',
    description: 'Graceful salwar suits and sets',
  },
  'kurtis': {
    name: 'Kurtis',
    description: 'Comfortable and stylish kurtis',
  },
  'lehengas': {
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

  // Phase 4: Get products from database by collection
  // No product carries the literal collection "New Arrivals"; it is simply the
  // newest of everything, which is how the homepage rail treats it too.
  const products =
    params.slug === 'new-arrivals'
      ? (await getAllProductsFromDB()).slice(0, 24)
      : await getProductsByCollectionFromDB(collectionData.name);

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
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
          {collectionData.name}
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl">
          {collectionData.description}
        </p>
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => {
            // Get first image from product.images array
            const productImage = product.images && product.images.length > 0 ? product.images[0] : null;
            
            return (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group"
                aria-label={`View ${product.name} - ${formatPrice(product.price)}`}
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100 mb-3">
                  {productImage ? (
                    productImage.startsWith('data:') ? (
                      // Base64 data URL - use regular img tag
                      <img
                        src={productImage}
                        alt={product.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : productImage.startsWith('http') ? (
                      // HTTP/HTTPS URL - use Next.js Image
                      <Image
                        src={productImage}
                        alt={product.name}
                        fill
                        className="object-cover object-top group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        quality={80}
                      />
                    ) : (
                      // Placeholder for invalid images
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 group-hover:from-gray-300 group-hover:to-gray-400 transition-colors flex items-center justify-center">
                        <span className="text-gray-500 text-sm">Product Image</span>
                      </div>
                    )
                  ) : (
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
                <p className="text-base md:text-lg font-bold">
                  {formatPrice(product.price)}
                </p>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No products found in this collection.</p>
        </div>
      )}
    </div>
  );
}

