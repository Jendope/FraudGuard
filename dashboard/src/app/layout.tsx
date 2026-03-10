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
  title: "FraudGuard - Modern Fraud Detection Dashboard",
  description:
    "FraudGuard is a modern Next.js dashboard for visualizing and managing fraud detection insights. Built with TypeScript, Tailwind CSS, and shadcn/ui.",
  keywords: [
    "FraudGuard",
    "Next.js",
    "TypeScript",
    "Tailwind CSS",
    "shadcn/ui",
    "fraud detection",
    "dashboard",
    "React",
  ],
  authors: [{ name: "James" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "FraudGuard",
    description:
      "A modern fraud detection dashboard built with Next.js, TypeScript, and Tailwind CSS.",
    url: "https://github.com/Jendope/allinone",
    siteName: "FraudGuard",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FraudGuard - Fraud Detection Dashboard",
    description:
      "Visualize and manage fraud detection insights with the FraudGuard dashboard.",
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
