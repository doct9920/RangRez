import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'We’ll be back soon | Rangrez',
  description: 'Rangrez is temporarily unavailable. Please visit again soon.',
  robots: { index: false, follow: false },
};

export default function StorePausedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fbf8f2] px-6 py-16 text-center">
      <section className="max-w-xl rounded-2xl border border-[#e8dfd1] bg-white px-8 py-12 shadow-sm sm:px-14">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8b6b35]">
          Rangrez
        </p>
        <h1 className="mt-5 text-3xl font-semibold text-[#2b241a] sm:text-4xl">
          We’ll be back soon
        </h1>
        <p className="mt-4 leading-7 text-[#6b6257]">
          Our store is temporarily unavailable. Please check back again shortly.
        </p>
      </section>
    </div>
  );
}
