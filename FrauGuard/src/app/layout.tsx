import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { GITHUB_REPO_URL } from "@/lib/site-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HK FraudGuard — Fraud Detection with RAG",
  description: "HK FraudGuard uses Large Language Models and Retrieval-Augmented Generation to detect fraudulent communications targeting Hong Kong residents.",
  keywords: ["fraud detection", "RAG", "LLM", "Hong Kong", "scam detection", "AI", "Retrieval-Augmented Generation", "FraudGuard"],
  authors: [{ name: "James" }],
  openGraph: {
    title: "HK FraudGuard — Fraud Detection with RAG",
    description: "Advanced fraud detection system using LLMs and RAG to protect Hong Kong residents from scams.",
    url: GITHUB_REPO_URL,
    siteName: "HK FraudGuard",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HK FraudGuard — Fraud Detection with RAG",
    description: "Advanced fraud detection system using LLMs and RAG to protect Hong Kong residents from scams.",
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
