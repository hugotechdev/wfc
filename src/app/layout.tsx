import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WFC Portal | Wachagga Family Community",
  description: "Mfumo rasmi wa kidijitali wa Wachagga Family Community - Umoja wa Wachagga, Nguvu ya Familia",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sw" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full bg-white text-black antialiased">{children}</body>
    </html>
  );
}
