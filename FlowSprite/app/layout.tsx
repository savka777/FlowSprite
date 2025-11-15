import type { Metadata } from "next";
import "./globals.css";
import { Pacifico } from "next/font/google";

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pacifico",
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
      <body className={pacifico.variable}>{children}</body>
    </html>
  );
}

