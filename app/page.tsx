import Link from 'next/link';
import Image from 'next/image';
import { getHomepageSettingsFromDB } from '@/lib/homepage-settings-db';
import HeroSlideshow from '@/components/HeroSlideshow';
import CategoryCarousel from '@/components/CategoryCarousel';
import { categoryBySlug } from '@/lib/categories';
import type { ShopCategory } from '@/lib/categories';
import { prisma } from '@/lib/prisma';
import ProductCarousel from '@/components/ProductCarousel';
import TrustHighlights from '@/components/TrustHighlights';
import Testimonials from '@/components/Testimonials';
import { getAllProductsFromDB } from '@/lib/products-db';

// These pages read products and homepage settings from the database. Without
// this they are prerendered once at build time, so catalogue and image changes
// only appear after a redeploy. Re-render at most once a minute instead.
export const revalidate = 60;

export default async function Home() {
  const settings = await getHomepageSettingsFromDB();
  const allProducts = await getAllProductsFromDB();

  // Every saree category, so the block fills from any of them. Falls back to
  // the newest products while the catalogue is still being set up.
  const sareeProducts = allProducts.filter((product) =>
    product.collection?.toLowerCase().includes('saree')
  );
  const featuredSarees = (sareeProducts.length > 0 ? sareeProducts : allProducts).slice(0, 12);

  // getAllProductsFromDB returns newest first.
  const newArrivals = allProducts.slice(0, 12);

  const suitProducts = allProducts.filter((product) =>
    product.collection?.toLowerCase().includes('suit')
  );
  const featuredSuits = (suitProducts.length > 0 ? suitProducts : allProducts).slice(0, 12);

  const shopAll = allProducts.slice(0, 12);
  
  // Fall back to the legacy single banner so an existing upload still shows.
  const heroSlides =
    settings?.heroSlides && settings.heroSlides.length > 0
      ? settings.heroSlides
      : settings?.heroBannerImage
      ? [settings.heroBannerImage]
      : [];
  const collectionImages = settings?.collectionImages || {};
  const dbCollections = await prisma.collection.findMany({
  where: {
    isVisible: true,
  },
  orderBy: {
    name: 'asc',
  },
});

const visibleCategories: ShopCategory[] = dbCollections.map((collection) => ({
  slug: collection.slug,
  name: collection.name,
  description:
    categoryBySlug.get(collection.slug)?.description || '',
}));

  return (
    <>
      {/* Hero Slideshow */}
      <HeroSlideshow slides={heroSlides} />

      {/* Featured Collections */}
      <section className="py-6 md:py-10 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-black mb-6 md:mb-8">
            Shop by Category
          </h2>
          <CategoryCarousel
  categories={visibleCategories}
  images={collectionImages}
/>
        </div>
      </section>

      {/* Saree Collection */}
      <section className="py-6 md:py-10 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-black mb-6 md:mb-8">
            Saree Collection
          </h2>
          <ProductCarousel products={featuredSarees} viewAllHref="/search?q=saree" />
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-6 md:py-10 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-black mb-6 md:mb-8">
            New Arrivals
          </h2>
          <ProductCarousel products={newArrivals} viewAllHref="/collections/new-arrivals" />
        </div>
      </section>

      {/* Suits Collection */}
      <section className="py-6 md:py-10 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-black mb-6 md:mb-8">
            Suits Collection
          </h2>
          <ProductCarousel products={featuredSuits} viewAllHref="/search?q=suit" />
        </div>
      </section>

      {/* Shop All */}
      <section className="py-6 md:py-10 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-black mb-6 md:mb-8">
            Shop All
          </h2>
          <ProductCarousel products={shopAll} viewAllHref="/products" />
        </div>
      </section>

      <TrustHighlights />

      <Testimonials />

      {/* CTA Section */}
      <section className="py-10 md:py-14 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Elevate Your Style?
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Browse our latest collection and find your perfect fit.
          </p>
          <Link
            href="/collections/new-arrivals"
            className="inline-block px-8 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Shop Now
          </Link>
        </div>
      </section>
    </>
  );
}
