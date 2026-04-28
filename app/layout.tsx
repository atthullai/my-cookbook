import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

// This metadata is shared by the whole app unless a page overrides part of it.
export const metadata: Metadata = {
  title: "My Cookbook",
  description: "Save, browse, and cook your favorite recipes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The root layout wraps every page, so this is the right place for site-wide navigation
    // and the single global stylesheet import.
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
