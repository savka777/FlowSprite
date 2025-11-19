import type { Metadata } from "next";
import "./globals.css";
import { Inter, Pacifico, Outfit } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });
const pacifico = Pacifico({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pacifico",
});
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "SpriteFlow - AI 2D Sprite Creator",
  description: "Node-based editor for creating 2D sprites and animations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${pacifico.variable} ${outfit.variable}`}>{children}</body>
    </html>
  );
}
