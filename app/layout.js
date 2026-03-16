import { Rubik } from "next/font/google";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata = {
  title: "Drawn",
  description: "Turn anything into editable Excalidraw diagrams",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${rubik.variable} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
