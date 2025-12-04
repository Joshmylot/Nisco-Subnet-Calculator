import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nisco Subnet Calculator",
  description: "A powerful IPv4 and VLSM subnet calculator with a clean Cisco-like interface.",
  keywords: ["Subnet Calculator", "VLSM", "IPv4", "Networking Tools", "Cisco", "CIDR"],
  authors: [{ name: "Joshua Omokanju" }],
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "Nisco Subnet Calculator",
    description: "A powerful IPv4 and VLSM subnet calculator with Cisco-style interface.",
    url: "https://nisco-subnet-calculator.vercel.app",
    siteName: "Nisco Subnet Calculator",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Nisco Subnet Calculator",
    description: "Advanced IPv4 + VLSM Calculator for Network Engineers.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
