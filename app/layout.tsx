import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Analytics from "@/components/Analytics";
import ErrorBoundaryWrapper from "@/components/ErrorBoundaryWrapper";

// Initialize default admin user (only in development)
if (process.env.NODE_ENV === 'development') {
  import('@/lib/init-admin').catch(() => {
    // Ignore errors during initialization
  });
}

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  manifest: '/manifest.json',
themeColor: '#111827',
icons: {
  icon: [
    {
      url: '/icons/icon-192.png',
      sizes: '192x192',
      type: 'image/png',
    },
    {
      url: '/icons/icon-512.png',
      sizes: '512x512',
      type: 'image/png',
    },
  ],
  apple: '/icons/icon-192.png',
},
  title: {
    default: "Rangrez | Premium Women's Wear | Rewari",
    template: "%s | Rangrez"
  },
  description: "Hand block printed sarees and suits from Rangrez, Rewari. Chanderi and Maheshwari silks, cotton suit sets and more, with fast delivery and easy returns.",
  keywords: ["sarees", "salwar suits", "hand block print", "women's wear", "Chanderi silk", "Maheshwari silk", "kurtis", "lehengas", "Rewari", "Rangrez"],
  authors: [{ name: "Rangrez" }],
  creator: "Rangrez",
  publisher: "Rangrez",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://rangrez.club'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: '/',
    siteName: 'Rangrez',
    title: "Rangrez | Premium Women's Wear | Rewari",
    description: "Hand block printed sarees and suits from Rangrez, Rewari. Chanderi and Maheshwari silks, cotton suit sets and more.",
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: "Rangrez - Premium Women's Wear",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Rangrez | Premium Women's Wear | Rewari",
    description: "Hand block printed sarees and suits from Rangrez, Rewari.",
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={dmSans.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={`${dmSans.className} antialiased`} suppressHydrationWarning>
        <Analytics />
        <ErrorBoundaryWrapper>
          <AuthProvider>
            <CartProvider>
              <Header />
              <main className="min-h-screen" id="main-content">
                {children}
              </main>
              <Footer />
              <WhatsAppButton />
            </CartProvider>
          </AuthProvider>
        </ErrorBoundaryWrapper>
      </body>
    </html>
  );
}

