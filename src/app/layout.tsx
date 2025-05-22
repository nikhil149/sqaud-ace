import type { Metadata } from "next";
// import { GeistSans } from "geist/font/sans"; // Removed GeistSans
// import { GeistMono } from "geist/font/mono"; // Removed GeistMono
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Squad Ace",
  description: "The ultimate cricket card game challenge.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="font-sans antialiased" // Updated to remove Geist variables
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
