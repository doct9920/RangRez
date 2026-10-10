import { whatsappHref } from '@/lib/contact';

export const metadata = {
  title: 'About Us',
  description: "Learn about Rangrez - Premium women's wear from Rewari",
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
      <h1 className="text-4xl md:text-5xl font-bold mb-8">About Rangrez</h1>
      
      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">Our Story</h2>
          <p className="text-gray-700 mb-4 leading-relaxed">
            Rangrez was born from a simple belief: every man deserves access to premium quality 
            women&apos;s wear that doesn&apos;t break the bank. Based in Rewari, we&apos;re passionate about bringing 
            you carefully curated fashion that combines style, quality, and value.
          </p>
          <p className="text-gray-700 mb-4 leading-relaxed">
            We understand that fashion is personal. That&apos;s why we focus on timeless pieces that 
            you&apos;ll love wearing, season after season. From classic shirts to modern essentials, 
            every product in our collection is chosen with care.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">Our Mission</h2>
          <p className="text-gray-700 mb-4 leading-relaxed">
            To make premium women&apos;s wear accessible to everyone, without compromising on quality or style. 
            We&apos;re committed to providing exceptional customer service and building lasting relationships 
            with our customers.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">Why Choose Us?</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Premium quality fabrics and craftsmanship</li>
            <li>Curated collections for the modern woman</li>
            <li>Fast and reliable delivery across India</li>
            <li>Personalized customer support via WhatsApp</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">Get in Touch</h2>
          <p className="text-gray-700 mb-4 leading-relaxed">
            Have questions? Want style advice? We&apos;re here to help! Reach out to us on WhatsApp 
            and we&apos;ll get back to you as soon as possible.
          </p>
          <a
            href={whatsappHref()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            <span>Chat with us on WhatsApp</span>
          </a>
        </section>
      </div>
    </div>
  );
}

