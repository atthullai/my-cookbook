import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import { ToastProvider } from "@/components/ToastProvider";
import { LibraryProvider } from "@/components/LibraryProvider";
import { PreferencesProvider } from "@/components/PreferencesProvider";
import { PantryProvider } from "@/components/PantryProvider";
import Fab from "@/components/Fab";
import "./globals.css";

// Baby-brain map:
// - This file wraps every page in the app.
// - Put things here only when they should appear everywhere, like the top navigation or global CSS.
// - Page-specific content belongs in that page's own page.tsx file, not here.

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
        <ToastProvider>
          <LibraryProvider>
            <PreferencesProvider>
              <PantryProvider>
                <SiteHeader />
                {children}
                <Fab />
              </PantryProvider>
            </PreferencesProvider>
          </LibraryProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
