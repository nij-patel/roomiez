import { Poppins } from "next/font/google";
import { Metadata } from "next";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Roomiez",
  description: "Roommate Relationship App",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={`${poppins.className} bg-[#FFECAE] text-gray-900`}>
        {children}
      </body>
    </html>
  );
}
