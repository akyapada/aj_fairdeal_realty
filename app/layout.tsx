import type { Metadata } from "next";
import { Suspense } from "react";
import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import Analytics from "@/components/Analytics";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const BASE_URL = "https://homyrealty.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Homy Realty — Hyderabad Apartments & Villas",
    template: "%s | Homy Realty",
  },
  description:
    "Honest, well-structured listings of new-launch and resale apartments and villas across Hyderabad.",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: "Homy Realty",
  url: BASE_URL,
  areaServed: {
    "@type": "City",
    name: "Hyderabad",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
