'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ShopCategory } from '@/lib/categories';

interface CategoryCarouselProps {
  categories: ShopCategory[];
  images: Record<string, string | undefined>;
}

/**
 * Render three copies and keep the scroll position in the middle copy.
 * Recenter by one copy's width to preserve seamless infinite scrolling.
 */
const COPIES = 3;

export default function CategoryCarousel({ categories, images }: CategoryCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const recentering = useRef(false);
  const [loops, setLoops] = useState(1);

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

    setLoops(track.scrollWidth > track.clientWidth + 1 ? 2 : 1);
  }, [categories.length]);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || !canLoop) return;

    const width = track.scrollWidth / COPIES;

    if (width > 0) {
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
      trackRef.current?.scrollBy({
        left: direction * getStep(),
        behavior: 'smooth',
      });
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
      {/* Previous category */}
      <button
        type="button"
        onClick={() => scrollByCards(-1)}
        aria-label="Previous categories"
        className="absolute left-0 top-[38%] z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#244FC4] shadow-md ring-1 ring-[#BFC8D5] backdrop-blur-sm transition hover:bg-[#F7F9FC] md:top-[42%]"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Next category */}
      <button
        type="button"
        onClick={() => scrollByCards(1)}
        aria-label="Next categories"
        className="absolute right-0 top-[38%] z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#244FC4] shadow-md ring-1 ring-[#BFC8D5] backdrop-blur-sm transition hover:bg-[#F7F9FC] md:top-[42%]"
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
              aria-hidden={
                canLoop &&
                (index < categories.length || index >= categories.length * 2)
              }
              tabIndex={
                canLoop &&
                (index < categories.length || index >= categories.length * 2)
                  ? -1
                  : undefined
              }
              className="group w-[26%] flex-shrink-0 snap-start text-center md:w-[calc((100%-3rem)/3)]"
            >
              <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-full bg-[#F7F9FC] ring-1 ring-[#BFC8D5] transition group-hover:ring-[#244FC4]">
                {image ? (
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
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#F7F9FC] to-[#BFC8D5]/60 px-3 text-center text-xs font-medium text-[#52627A]">
                    {category.name}
                  </div>
                )}
              </div>

              <h3 className="mt-2 text-xs uppercase leading-tight tracking-wide text-[#244FC4] transition-colors group-hover:text-[#202C46] sm:text-sm md:mt-4">
                {category.name}
              </h3>
            </Link>
          );
        })}
      </div>
    </div>
  );
}