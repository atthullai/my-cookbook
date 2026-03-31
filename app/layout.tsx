import type { Metadata } from "next";
import Link from "next/link";
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
        <header className="site-shell">
          <nav className="site-nav">
            <Link href="/">Home</Link>
            <Link href="/recipes">Recipes</Link>
            <Link href="/about">About Me</Link>
            <Link href="/add">Add Recipe</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
