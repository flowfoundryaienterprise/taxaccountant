import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { SiteChrome } from "@/components/layout/site-chrome";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ConvexClientProvider } from "@/components/shared/convex-client-provider";
import { getToken } from "@/lib/auth/server";
import { SITE_DESCRIPTION, SITE_NAME, SITE_ORIGIN } from "@/lib/seo/site";

import "./globals.css";

/* Neutral sans-serif typography follows the supplied reference. */
const referenceFont = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    siteName: SITE_NAME,
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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Read server-side so the client starts already knowing the auth state
  // (src/components/shared/convex-client-provider.tsx) instead of
  // flashing "signed out" on every navigation.
  const token = await getToken();

  return (
    <html lang="en" className={referenceFont.variable}>
      <body className="flex min-h-screen flex-col">
        <ConvexClientProvider initialToken={token}>
          {/*
            `SiteChrome` renders the public header/footer for every public
            route and steps aside for the CMS at `/admin`, which brings its
            own full-height layout. Both are rendered here on the server and
            handed down as props, so they stay Server Components.
          */}
          <SiteChrome header={<SiteHeader />} footer={<SiteFooter />}>
            {children}
          </SiteChrome>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
