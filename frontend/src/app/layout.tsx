import { Poppins } from "next/font/google";
import { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { FontProvider } from "@/contexts/FontContext";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Roomiez - simplify your roommate experience",
  description: "Helping roommates not hate each other. Manage expenses, chores, groceries, and shared spaces with your roommates.",
  keywords: ["roommate", "house management", "expense tracking", "chore management", "shared living"],
  authors: [{ name: "Nij Patel" }],
  creator: "Nij Patel",
  publisher: "Nij Patel",
  metadataBase: new URL('https://roomiez.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://roomiez.app',
    title: 'Roomiez - simplify your roommate experience',
    description: 'Helping roommates not hate each other. Manage expenses, chores, groceries, and shared spaces with your roommates.',
    siteName: 'Roomiez',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Roomiez - Roommate Management App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Roomiez - simplify your roommate experience',
    description: 'Manage expenses, chores, groceries, and shared spaces with your roommates.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
    ],
    shortcut: '/favicon.svg',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="bg-[#FFECAE] text-gray-900 font-pixel">
        <FontProvider>
        {children}
          <Analytics />
        </FontProvider>
      </body>
    </html>
  );
}
