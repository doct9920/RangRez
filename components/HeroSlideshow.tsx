
'use client';

import { useEffect, useState, useCallback } from 'react';

interface HeroSlideshowProps {
  slides: string[];
}

const SLIDE_DURATION = 12000;

export default function HeroSlideshow({ slides }: HeroSlideshowProps) {
  const validSlides = slides.filter(
    (slide) => typeof slide === 'string' && slide.trim().length > 0
  );

  const [current, setCurrent] = useState(0);

  const nextSlide = useCallback(() => {
    if (validSlides.length < 2) return;
    setCurrent((prev) => (prev + 1) % validSlides.length);
  }, [validSlides.length]);

  const previousSlide = useCallback(() => {
    if (validSlides.length < 2) return;
    setCurrent(
      (prev) => (prev - 1 + validSlides.length) % validSlides.length
    );
  }, [validSlides.length]);

  // Autoplay
  useEffect(() => {
    if (validSlides.length < 2) return;

    const timer = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % validSlides.length);
    }, SLIDE_DURATION);

    return () => clearTimeout(timer);
  }, [current, validSlides.length]);

  // Reset index if slides change
  useEffect(() => {
    if (current >= validSlides.length) {
      setCurrent(0);
    }
  }, [current, validSlides.length]);

  // Swipe support
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const MIN_SWIPE_DISTANCE = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return;

    const distance = touchStart - touchEnd;

    if (Math.abs(distance) < MIN_SWIPE_DISTANCE) {
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }

    if (distance > 0) {
      nextSlide();
    } else {
      previousSlide();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // Responsive hero: mobile 460px, desktop 520px
  const heroHeight = 'relative isolate w-full h-[460px] md:h-[520px]';

  if (validSlides.length === 0) {
    return (
      <section
        className={`${heroHeight} overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800`}
        aria-label="Featured collections"
      />
    );
  }

  return (
    <section
      className={`${heroHeight} overflow-hidden bg-neutral-100 select-none`}
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Blurred background follows the active banner photo */}
      <div
        className="absolute inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={validSlides[current]}
          alt=""
          className="block w-full h-full object-cover scale-110 blur-lg"
          draggable={false}
        />
      </div>

      {/* Soft overlay for a subtle luxury look */}
      <div
        className="absolute inset-0 z-[1] bg-white/25"
        aria-hidden="true"
      />

      {/* Original banner image stays uncropped in the foreground */}
      {validSlides.map((slide, index) => (
        <div
          key={`${slide}-${index}`}
          aria-hidden={index !== current}
          className={`absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-700 ease-in-out ${
            index === current ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide}
            alt={`Rangrez featured collection slide ${index + 1}`}
            width={1920}
            height={900}
            loading={index === 0 ? 'eager' : 'lazy'}
            fetchPriority={index === 0 ? 'high' : 'auto'}
            decoding="async"
            draggable={false}
            className="block w-full h-full object-contain"
          />
        </div>
      ))}

      {/* Previous and Next buttons */}
      {validSlides.length > 1 && (
        <>
          <button
            type="button"
            onClick={previousSlide}
            aria-label="Previous slide"
            className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 z-20
                       w-9 h-9 md:w-12 md:h-12
                       rounded-full bg-black/40 hover:bg-black/60
                       text-white flex items-center justify-center
                       transition-all duration-200 backdrop-blur-sm"
          >
            <span className="text-2xl md:text-3xl leading-none">‹</span>
          </button>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next slide"
            className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 z-20
                       w-9 h-9 md:w-12 md:h-12
                       rounded-full bg-black/40 hover:bg-black/60
                       text-white flex items-center justify-center
                       transition-all duration-200 backdrop-blur-sm"
          >
            <span className="text-2xl md:text-3xl leading-none">›</span>
          </button>
        </>
      )}

      {/* Slide indicators */}
      {validSlides.length > 1 && (
        <div className="absolute bottom-3 md:bottom-5 left-0 right-0 z-20 flex justify-center gap-2">
          {validSlides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrent(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === current}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === current
                  ? 'w-7 bg-white'
                  : 'w-2 bg-white/70 hover:bg-white'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
