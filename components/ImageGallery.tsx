
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';

type ImageGalleryProps = {
  images: string[];
  productName?: string;
};

export default function ImageGallery({
  images,
  productName = 'Product',
}: ImageGalleryProps) {
  const validImages = images.filter(Boolean);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [manualScale, setManualScale] = useState(1);
  const [manualX, setManualX] = useState(0);
  const [manualY, setManualY] = useState(0);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const pinchStartRef = useRef<{ distance: number; scale: number } | null>(
    null
  );
  const panStartRef = useRef<{
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const currentImage = validImages[selectedIndex] || '';

  const resetManualZoom = useCallback(() => {
    setManualScale(1);
    setManualX(0);
    setManualY(0);
    touchStartRef.current = null;
    pinchStartRef.current = null;
    panStartRef.current = null;
  }, []);

  const closeZoom = useCallback(() => {
    setIsZoomOpen(false);
    setIsInteracting(false);
    resetManualZoom();
  }, [resetManualZoom]);

  const openZoom = useCallback(() => {
    resetManualZoom();
    setIsInteracting(false);
    setIsZoomOpen(true);
  }, [resetManualZoom]);

  const showPrevious = useCallback(() => {
    setSelectedIndex((index) =>
      index === 0 ? validImages.length - 1 : index - 1
    );
    resetManualZoom();
  }, [resetManualZoom, validImages.length]);

  const showNext = useCallback(() => {
    setSelectedIndex((index) =>
      index === validImages.length - 1 ? 0 : index + 1
    );
    resetManualZoom();
  }, [resetManualZoom, validImages.length]);

  useEffect(() => {
    if (!isZoomOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeZoom();
      if (event.key === 'ArrowLeft') showPrevious();
      if (event.key === 'ArrowRight') showNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isZoomOpen, closeZoom, showPrevious, showNext]);

  const getTouchDistance = (touches: React.TouchList) => {
    const first = touches[0];
    const second = touches[1];

    if (!first || !second) return 0;

    return Math.hypot(
      second.clientX - first.clientX,
      second.clientY - first.clientY
    );
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 0) return;

    // Touching the image pauses automatic animation.
    setIsInteracting(true);

    if (event.touches.length >= 2) {
      event.preventDefault();

      pinchStartRef.current = {
        distance: getTouchDistance(event.touches),
        scale: manualScale,
      };

      panStartRef.current = null;
      touchStartRef.current = null;
      return;
    }

    const touch = event.touches[0];

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };

    if (manualScale > 1) {
      panStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        offsetX: manualX,
        offsetY: manualY,
      };
    }
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length >= 2) {
      event.preventDefault();

      const start = pinchStartRef.current;
      const distance = getTouchDistance(event.touches);

      if (start && start.distance > 0 && distance > 0) {
        const nextScale = Math.min(
          4,
          Math.max(1, start.scale * (distance / start.distance))
        );

        setManualScale(nextScale);

        if (nextScale === 1) {
          setManualX(0);
          setManualY(0);
        }
      }

      return;
    }

    const touch = event.touches[0];
    const start = panStartRef.current;

    if (touch && start && manualScale > 1) {
      event.preventDefault();

      setManualX(start.offsetX + touch.clientX - start.x);
      setManualY(start.offsetY + touch.clientY - start.y);
    }
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length < 2) {
      pinchStartRef.current = null;
    }

    if (event.touches.length === 0) {
      touchStartRef.current = null;
      panStartRef.current = null;
    }
  };

  if (validImages.length === 0) {
    return (
      <div className="flex aspect-[3/4] w-full items-center justify-center rounded-xl bg-gray-100 text-gray-400">
        Product image unavailable
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Main product image */}
      <div
        className="group relative aspect-[3/4] w-full cursor-zoom-in overflow-hidden rounded-xl bg-gray-50"
        onClick={openZoom}
      >
        <Image
          src={currentImage}
          alt={productName}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
        />

        <div className="absolute bottom-3 right-3 rounded-full bg-black/65 px-3 py-2 text-xs text-white">
          Tap to zoom
        </div>
      </div>

      {/* Thumbnail images */}
      {validImages.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {validImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setSelectedIndex(index)}
              aria-label={`View image ${index + 1}`}
              aria-pressed={selectedIndex === index}
              className={`relative h-20 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 ${
                selectedIndex === index
                  ? 'border-gray-900'
                  : 'border-gray-200'
              }`}
            >
              <Image
                src={image}
                alt={`${productName} image ${index + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Full-screen zoom modal */}
      <AnimatePresence>
        {isZoomOpen && (
          <motion.div
            key="product-image-zoom"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black"
            onClick={closeZoom}
          >
            {/* Modal controls */}
            <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-4 py-4 text-white">
              <span className="text-sm">
                {selectedIndex + 1} / {validImages.length}
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    resetManualZoom();
                    setIsInteracting(false);
                  }}
                  className="rounded-full bg-white/15 px-3 py-2 text-sm"
                  aria-label="Reset zoom"
                >
                  Reset
                </button>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    closeZoom();
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-2xl"
                  aria-label="Close zoom"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Image interaction area */}
            <div
              className="relative flex h-full w-full items-center justify-center overflow-hidden"
              style={{ touchAction: 'none' }}
              onClick={(event) => event.stopPropagation()}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              onDoubleClick={() => {
                setIsInteracting(true);

                if (manualScale > 1) {
                  resetManualZoom();
                } else {
                  setManualScale(2);
                }
              }}
            >
              <motion.div
                key={currentImage}
                className="relative h-[82vh] w-[92vw] md:h-[88vh] md:w-[85vw]"
                animate={
                  isInteracting
                    ? {
                        scale: manualScale,
                        x: manualX,
                        y: manualY,
                      }
                    : {
                        scale: [1, 1.35, 1.35, 1],
                        x: [0, -12, 12, 0],
                        y: [0, 8, -8, 0],
                      }
                }
                transition={
                  isInteracting
                    ? { type: 'spring', stiffness: 260, damping: 30 }
                    : {
                        duration: 8,
                        ease: 'easeInOut',
                        repeat: Infinity,
                        repeatType: 'loop',
                      }
                }
                style={{
                  transformOrigin: 'center center',
                  willChange: 'transform',
                }}
              >
                <Image
                  src={currentImage}
                  alt={`${productName} zoomed`}
                  fill
                  priority
                  sizes="100vw"
                  draggable={false}
                  className="pointer-events-none select-none object-contain"
                />
              </motion.div>
            </div>

            {/* Navigation */}
            {validImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    showPrevious();
                    setIsInteracting(false);
                  }}
                  className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-3xl text-white"
                  aria-label="Previous image"
                >
                  ‹
                </button>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    showNext();
                    setIsInteracting(false);
                  }}
                  className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-3xl text-white"
                  aria-label="Next image"
                >
                  ›
                </button>
              </>
            )}

            <div className="pointer-events-none absolute bottom-5 left-0 right-0 z-20 text-center text-xs text-white/80">
              Pinch to zoom · Drag to move · Double-tap to zoom
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
