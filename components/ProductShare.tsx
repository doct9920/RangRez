"use client";

import { useState } from "react";

type Props = {
  productId: string;
  productName: string;
};

export default function ProductShare({ productId, productName }: Props) {
  const [copied, setCopied] = useState(false);

  const url = `https://rangrez.club/products/${encodeURIComponent(productId)}`;
  const message = `Check out ${productName} on Rangrez: ${url}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy product link:", url);
    }
  }

  async function shareProduct() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: `Check out ${productName} on Rangrez`,
          url,
        });
      } catch {
        // Customer may cancel the share dialog.
      }
    } else {
      await copyLink();
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-gray-200 p-4">
      <h3 className="mb-3 text-base font-semibold text-gray-900">
        Share This Product
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={shareProduct}
          className="rounded-lg bg-[#7b1f2b] px-4 py-3 text-sm font-semibold text-white"
        >
          Share Product
        </button>

        <button
          type="button"
          onClick={copyLink}
          className="rounded-lg border border-[#7b1f2b] px-4 py-3 text-sm font-semibold text-[#7b1f2b]"
        >
          {copied ? "Link Copied!" : "Copy Link"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-700 underline"
        >
          WhatsApp
        </a>

        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-700 underline"
        >
          Facebook
        </a>

        <a
          href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(productName)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-700 underline"
        >
          Telegram
        </a>
      </div>
    </section>
  );
}
