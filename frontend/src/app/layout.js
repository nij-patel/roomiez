import { Poppins } from "next/font/google";
import "./globals.css"; // Make sure this exists

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"], // Import different font weights
});

export const metadata = {
  title: "Roomiez",
  description: "Roommate Relationship App",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${poppins.className} bg-[#FFECAE] text-gray-900`}>
        {children}
      </body>
    </html>
  );
}
