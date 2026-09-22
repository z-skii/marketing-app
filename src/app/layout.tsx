import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { siteMetadata } from "@/config/site";
import { AuthHashForwarder } from "@/components/AuthHashForwarder";
import { PresenceBeacon } from "@/components/PresenceBeacon";
import "./globals.css";
import "@/vehicle/vehicle.css";

/**
 * One typeface for the whole product: DM Sans carries every size in the
 * V3 language (docs/design-lab-v3/EXPERIENCE_DIRECTION.md, typography),
 * so the root loads one family and nothing else. Inter and IBM Plex Mono
 * were retired with the V3 migration; monospace falls back to the system
 * stack (globals.css).
 */
const sans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = siteMetadata;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F7F5" },
    { media: "(prefers-color-scheme: dark)", color: "#F6F7F5" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sans.variable}>
      <body>
        <AuthHashForwarder />
        <PresenceBeacon />
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
