import { Rubik } from "next/font/google";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata = {
  title: "Drawn – Instant diagrams you can build on",
  description: "Drop in text, code, or images — get an editable Excalidraw diagram in seconds. Powered by GPT-5.4, free to use, open source.",
  openGraph: {
    title: "Drawn – Instant diagrams you can build on",
    description: "Drop in text, code, or images — get an editable Excalidraw diagram in seconds. Powered by GPT-5.4, free to use, open source.",
    url: "https://drawn.dev",
    images: [{ url: "/drawn-og.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Drawn – Instant diagrams you can build on",
    description: "Drop in text, code, or images — get an editable Excalidraw diagram in seconds. Powered by GPT-5.4, free to use, open source.",
    images: ["/drawn-og.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/drawn-logo.svg" type="image/svg+xml" />
      </head>
      <body className={`${rubik.variable} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
