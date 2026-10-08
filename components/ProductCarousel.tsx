'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Product } from '@/lib/products';

interface ProductCarouselProps {
  products: Product[];
  viewAllHref: string;
}

const WISHLIST_KEY = 'rangrez_wishlist';
const WISHLIST_EVENT = 'rangrez-wishlist-change';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);

export default function ProductCarousel({
  products,
  viewAllHref,
}: ProductCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Saved items live in this browser only - there is no wishlist API yet.
  // The page renders more than one carousel and a product can appear in both,
  // so instances broadcast changes to keep their hearts in sync.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_KEY);
      if (stored) setWishlist(JSON.parse(stored));
    } catch {
      // Ignore unreadable storage (private mode, cleared site data).
    }

    const onChange = (event: Event) => {
      setWishlist((event as CustomEvent<string[]>).detail);
    };

    window.addEventListener(WISHLIST_EVENT, onChange);

    return () => window.removeEventListener(WISHLIST_EVENT, onChange);
  }, []);

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const next = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];

      try {
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
      } catch {
        // Ignore write failures; the toggle still works for this page view.
      }

      window.dispatchEvent(
        new CustomEvent(WISHLIST_EVENT, { detail: next })
      );

      return next;
    });
  };

  const getStep = useCallback(() => {
    const track = trackRef.current;

    if (!track) return 0;

    const first = track.firstElementChild as HTMLElement | null;

    if (!first) return 0;

    const gap =
      parseFloat(getComputedStyle(track).columnGap || '0') || 0;

    return first.offsetWidth + gap;
  }, []);

  const updateArrows = useCallback(() => {
    const track = trackRef.current;

    if (!track) return;

    const maxScroll = track.scrollWidth - track.clientWidth;

    setAtStart(track.scrollLeft <= 1);
    setAtEnd(track.scrollLeft >= maxScroll - 1);
  }, []);

  const scrollByCards = useCallback(
    (direction: 1 | -1) => {
      trackRef.current?.scrollBy({
        left: direction * getStep(),
        behavior: 'smooth',
      });
    },
    [getStep]
  );

  useEffect(() => {
    updateArrows();

    window.addEventListener('resize', updateArrows);

    return () => window.removeEventListener('resize', updateArrows);
  }, [updateArrows]);

  if (products.length === 0) return null;

  return (
    <div>
      <div className="relative">
        {/* Previous button */}
        <button
          type="button"
          onClick={() => scrollByCards(-1)}
          aria-label="Previous products"
          className={`absolute left-0 top-[30%] z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-gray-600 shadow-md ring-1 ring-black/5 backdrop-blur-sm transition hover:bg-white ${
            atStart ? 'opacity-40' : ''
          }`}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Next button */}
        <button
          type="button"
          onClick={() => scrollByCards(1)}
          aria-label="Next products"
          className={`absolute right-0 top-[30%] z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-gray-600 shadow-md ring-1 ring-black/5 backdrop-blur-sm transition hover:bg-white ${
            atEnd ? 'opacity-40' : ''
          }`}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* Products */}
        <div
          ref={trackRef}
          onScroll={updateArrows}
          className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth md:gap-6"
        >
          {products.map((product) => {
            const image = product.images?.[0];

            const discount =
              product.compareAtPrice &&
              product.compareAtPrice > product.price
                ? Math.round(
                    (1 - product.price / product.compareAtPrice) * 100
                  )
                : 0;

            const saved = wishlist.includes(product.id);

            return (
              <div
                key={product.id}
                className="w-[46%] flex-shrink-0 snap-start md:w-[calc((100%-4.5rem)/4)]"
              >
                <div className="group relative">
                  <Link
                    href={`/products/${product.id}`}
                    className="block"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-gray-100">
                      {image ? (
                        // Images are base64 data URLs or remote URLs, so a plain
                        // img keeps both working without next/image host config.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={image}
                          alt={product.name}
                          width={400}
                          height={533}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 text-sm text-gray-500">
                          Product Image
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Wishlist */}
                  <button
                    type="button"
                    onClick={() => toggleWishlist(product.id)}
                    aria-label={
                      saved
                        ? `Remove ${product.name} from saved items`
                        : `Save ${product.name}`
                    }
                    aria-pressed={saved}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow ring-1 ring-gray-200 transition hover:bg-white"
                  >
                    <svg
                      className={`h-4 w-4 ${
                        saved ? 'text-[#7b1f2b]' : 'text-gray-500'
                      }`}
                      fill={saved ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </button>
                </div>

                <Link
                  href={`/products/${product.id}`}
                  className="block"
                >
                  <h3 className="mt-3 text-sm leading-snug text-[#7b1f2b] line-clamp-2">
                    {product.name}
                  </h3>

                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-base font-bold text-gray-900">
                      {formatPrice(product.price)}
                    </span>

                    {discount > 0 && (
                      <>
                        <span className="text-sm text-gray-400 line-through">
                          {formatPrice(product.compareAtPrice!)}
                        </span>

                        <span className="rounded bg-green-50 px-1.5 py-0.5 text-xs font-semibold text-green-700">
                          {discount}% Off
                        </span>
                      </>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* View All */}
      <div className="mt-2 md:mt-6 flex justify-center">
        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-2 border border-gray-300 px-8 py-3 text-sm font-medium uppercase tracking-wide text-gray-900 transition hover:border-gray-900 hover:bg-gray-900 hover:text-white"
        >
          View All
          <span aria-hidden="true">&rsaquo;</span>
        </Link>
      </div>
    </div>
  );
}