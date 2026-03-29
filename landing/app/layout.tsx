import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Upcreate | Satış Odaklı Creator Kampanyaları",
  description: "Creator'larla satış odaklı kampanyalar. Performans bazlı iş birlikleriyle daha ölçülebilir büyüme.",
  openGraph: {
    title: "Upcreate | Satış Odaklı Creator Kampanyaları",
    description: "Creator'larla satış odaklı kampanyalar. Performans bazlı iş birlikleriyle daha ölçülebilir büyüme.",
    locale: "tr_TR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Upcreate',
    url: 'https://upcreate.co',
    description: "Creator marketing'i satış kanalına dönüştürüyoruz. Performans bazlı creator iş birlikleri.",
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'hello@upcreate.co',
      contactType: 'Customer Service',
    },
  };

  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 min-h-0">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
