
'use client';

import { useEffect, useState } from 'react';

interface Props {
  images: string[];
  name: string;
}

export default function ProductImageRotator({
  images,
  name,
}: Props) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive(0);
  }, [images.join('|')]);

  useEffect(() => {
    if (images.length < 2) return;

    const timer = window.setInterval(() => {
      setActive((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [images.length]);

  const current = images.length
    ? active % images.length
    : 0;

  return (
    <div>
      <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-[#F7F9FC]">
        {images.length ? (
          images.map((src, index) => (
            <img
              key={`${src}-${index}`}
              src={src}
              alt={`${name} - Photo ${index + 1}`}
              loading="lazy"
              decoding="async"
              className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-700 ${
                current === index
                  ? 'opacity-100'
                  : 'opacity-0'
              }`}
            />
          ))
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            Product Image
          </div>
        )}

        {images.length > 1 && (
          <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
            {current + 1}/{images.length}
          </span>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {images.slice(0, 4).map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show photo ${index + 1}`}
              aria-pressed={current === index}
              className={`aspect-square overflow-hidden rounded border-2 ${
                current === index
                  ? 'border-[#244FC4]'
                  : 'border-transparent'
              }`}
            >
              <img
                src={src}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
