import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ConvexClientProvider } from "@/components/shared/convex-client-provider";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://taxaccountant.com"),
  title: {
    default: "TaxAccountant.com",
    template: "%s | TaxAccountant.com",
  },
  description:
    "TaxAccountant.com connects customers with qualified tax and accounting professionals worldwide.",
  openGraph: {
    siteName: "TaxAccountant.com",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  /*
   * Declared explicitly rather than relying on the `app/icon.*` file
   * convention: vinext's file-based metadata support does not clearly cover
   * SVG icons, and these assets are generated into `public/` by
   * `scripts/generate-icons.mjs`. `favicon.svg` serves every browser that
   * accepts a vector favicon; the PNG/ICO entries are the fallbacks for the
   * ones that do not (notably Safari, which needs a raster for
   * apple-touch-icon).
   */
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col">
        <ConvexClientProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
