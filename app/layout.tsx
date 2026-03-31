import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

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
    // Keep the root layout lean so every page inherits the same CSS without hidden app-wide logic.
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
