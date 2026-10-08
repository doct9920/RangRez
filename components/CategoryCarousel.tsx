'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ShopCategory } from '@/lib/categories';

interface CategoryCarouselProps {
  categories: ShopCategory[];
  images: Record<string, string | undefined>;
}

/**
 * The list is rendered three times and the scroll position is kept in the
 * middle copy. Whenever it drifts into an outer copy, it jumps back by exactly
 * one copy's width - the same tiles are under the cursor, so the seam is
 * invisible and scrolling never reaches an end in either direction.
 */
const COPIES = 3;

export default function CategoryCarousel({ categories, images }: CategoryCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const recentering = useRef(false);
  const [loops, setLoops] = useState(1);

  // Only loop when there is more than a screenful; a short list would jitter.
  const canLoop = loops > 1;
  const items = canLoop
    ? Array.from({ length: COPIES }, () => categories).flat()
    : categories;

  const copyWidth = useCallback(() => {
    const track = trackRef.current;
    if (!track || !canLoop) return 0;
    return track.scrollWidth / COPIES;
  }, [canLoop]);

  const getStep = useCallback(() => {
    const track = trackRef.current;
    const first = track?.firstElementChild as HTMLElement | null;
    if (!track || !first) return 0;
    const gap = parseFloat(getComputedStyle(track).columnGap || '0') || 0;
    return first.offsetWidth + gap;
  }, []);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    // Loop only if the tiles actually overflow their container.
    setLoops(track.scrollWidth > track.clientWidth + 1 ? 2 : 1);
  }, [categories.length]);

  // Start in the middle copy so there is room to scroll either way.
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || !canLoop) return;
    const width = track.scrollWidth / COPIES;
    if (width > 0) {
      // The track scrolls smoothly, so assigning scrollLeft would animate the
      // carousel across the screen on load. Place it instantly instead.
      recentering.current = true;
      const previous = track.style.scrollBehavior;
      track.style.scrollBehavior = 'auto';
      track.scrollLeft = width;
      track.style.scrollBehavior = previous;
      recentering.current = false;
    }
  }, [canLoop, categories.length]);

  const recenter = useCallback(() => {
    const track = trackRef.current;
    if (!track || !canLoop || recentering.current) return;

    const width = copyWidth();
    if (width <= 0) return;

    // Jumping by a whole copy lands on an identical tile, so nothing appears
    // to move. Disable smooth scrolling first or the jump would animate.
    if (track.scrollLeft < width * 0.5 || track.scrollLeft > width * 1.5) {
      const offset = track.scrollLeft < width * 0.5 ? width : -width;
      recentering.current = true;
      const previous = track.style.scrollBehavior;
      track.style.scrollBehavior = 'auto';
      track.scrollLeft += offset;
      track.style.scrollBehavior = previous;
      recentering.current = false;
    }
  }, [canLoop, copyWidth]);

  const scrollByCards = useCallback(
    (direction: 1 | -1) => {
      trackRef.current?.scrollBy({ left: direction * getStep(), behavior: 'smooth' });
    },
    [getStep]
  );

  useEffect(() => {
    window.addEventListener('resize', recenter);
    return () => window.removeEventListener('resize', recenter);
  }, [recenter]);

  if (categories.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scrollByCards(-1)}
        aria-label="Previous categories"
        className="absolute left-0 top-[38%] md:top-[42%] z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-gray-600 shadow-md ring-1 ring-black/5 backdrop-blur-sm transition hover:bg-white"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => scrollByCards(1)}
        aria-label="Next categories"
        className="absolute right-0 top-[38%] md:top-[42%] z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-gray-600 shadow-md ring-1 ring-black/5 backdrop-blur-sm transition hover:bg-white"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div
        ref={trackRef}
        onScroll={recenter}
        className="no-scrollbar flex snap-x gap-2 overflow-x-auto scroll-smooth md:gap-6"
      >
        {items.map((category, index) => {
          const image = images[category.slug];
          return (
            <Link
              key={`${category.slug}-${index}`}
              href={`/collections/${category.slug}`}
              // Duplicated tiles are decoration; only the middle copy is real
              // as far as assistive technology is concerned.
              aria-hidden={canLoop && (index < categories.length || index >= categories.length * 2)}
              tabIndex={
                canLoop && (index < categories.length || index >= categories.length * 2)
                  ? -1
                  : undefined
              }
              className="group w-[26%] flex-shrink-0 snap-start text-center md:w-[calc((100%-3rem)/3)]"
            >
              <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-full bg-gray-100 ring-1 ring-gray-200 transition group-hover:ring-gray-400">
                {image ? (
                  // Images are base64 data URLs or remote URLs, so a plain img
                  // keeps both working without next/image host config.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image}
                    alt={category.name}
                    width={300}
                    height={300}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 px-3 text-center text-xs font-medium text-gray-500">
                    {category.name}
                  </div>
                )}
              </div>
              <h3 className="mt-2 md:mt-4 text-xs uppercase leading-tight tracking-wide text-[#7b1f2b] sm:text-sm">
                {category.name}
              </h3>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
