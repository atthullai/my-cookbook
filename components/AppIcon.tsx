"use client";

import type { ReactNode } from "react";

type IconName =
  | "home"
  | "book"
  | "about"
  | "add"
  | "login"
  | "logout"
  | "edit"
  | "delete"
  | "print"
  | "globe"
  | "veg"
  | "vegan"
  | "nonveg"
  | "spicy"
  | "protein"
  | "quick"
  | "onepot"
  | "festival"
  | "breakfast"
  | "lunch"
  | "dinner"
  | "dessert"
  | "good"
  | "excellent"
  | "tag"
  | "recipe";

type AppIconProps = {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
};

const iconPaths: Record<IconName, ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5M5.5 9.5V21h13V9.5" />,
  book: (
    <>
      <path d="M5 4.5h10.5A3.5 3.5 0 0 1 19 8v12.5H8.5A3.5 3.5 0 0 0 5 24z" />
      <path d="M5 4.5A3.5 3.5 0 0 0 1.5 8v12.5H12A3.5 3.5 0 0 1 15.5 24" />
    </>
  ),
  about: (
    <>
      <circle cx="12" cy="7" r="3.25" />
      <path d="M5.5 20c1.6-3.2 4-4.8 6.5-4.8S16.9 16.8 18.5 20" />
    </>
  ),
  add: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  login: (
    <>
      <path d="M13 5h4.5A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5H13" />
      <path d="M10 16l4-4-4-4" />
      <path d="M14 12H4" />
    </>
  ),
  logout: (
    <>
      <path d="M11 5H6.5A2.5 2.5 0 0 0 4 7.5v9A2.5 2.5 0 0 0 6.5 19H11" />
      <path d="M14 16l4-4-4-4" />
      <path d="M9 12h9" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20.5 8 20l9.5-9.5a2.1 2.1 0 0 0-3-3L5 17l-.5 3.5Z" />
      <path d="m12.5 6.5 3 3" />
    </>
  ),
  delete: (
    <>
      <path d="M4.5 7h15" />
      <path d="M9 3.5h6" />
      <path d="M7 7l.7 12.5h8.6L17 7" />
    </>
  ),
  print: (
    <>
      <path d="M7 8V3.5h10V8" />
      <path d="M6.5 18.5H5A2.5 2.5 0 0 1 2.5 16v-4A2.5 2.5 0 0 1 5 9.5h14a2.5 2.5 0 0 1 2.5 2.5v4A2.5 2.5 0 0 1 19 18.5h-1.5" />
      <path d="M7 14.5h10v6H7z" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.8 12h16.4" />
      <path d="M12 3.5c2.5 2.6 3.7 5.4 3.7 8.5s-1.2 5.9-3.7 8.5c-2.5-2.6-3.7-5.4-3.7-8.5S9.5 6.1 12 3.5Z" />
    </>
  ),
  veg: (
    <>
      <path d="M5 15c0-5 3.8-8.5 10-9-1 6.2-4 10-9 10-1 0-1.5-.3-1.5-1Z" />
      <path d="M8 14c2-2.2 4.3-4 7-5.2" />
    </>
  ),
  vegan: (
    <>
      <path d="M7 15c0-4.6 3.5-8 9.2-8.5-.8 5.7-3.7 9.2-8.3 9.2-.6 0-.9-.2-.9-.7Z" />
      <path d="M11.5 6.5c.8-1.8 2.1-3 4-3.8" />
      <path d="M9.5 13.8c1.7-2 3.7-3.6 6.1-4.8" />
    </>
  ),
  nonveg: (
    <>
      <path d="M8 8.5c0-2.3 1.8-4 4-4s4 1.7 4 4c0 1.4-.7 2.5-1.8 3.4l-2.2 1.6-2.2-1.6C8.7 11 8 9.9 8 8.5Z" />
      <path d="M6.5 15.5c1.8-1.2 3.6-1.6 5.5-1.6s3.7.4 5.5 1.6" />
      <path d="M7.5 20c1.6-1.2 3-1.7 4.5-1.7s2.9.5 4.5 1.7" />
    </>
  ),
  spicy: (
    <>
      <path d="M7 15c0-3.8 2.7-7 6.4-7.8.2 2.3 1.1 3.8 3.1 5.1-1.1 3.5-4.1 5.7-7.6 5.7-1.2 0-1.9-1-1.9-3Z" />
      <path d="M13.5 5c0-1.5.8-2.5 2.2-3" />
    </>
  ),
  protein: (
    <>
      <path d="M6.5 15.5 9.5 7l2.5 5 2.5-5 3 8.5" />
      <path d="M8.2 12h7.6" />
    </>
  ),
  quick: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3 1.7" />
    </>
  ),
  onepot: (
    <>
      <path d="M5 10.5h14v6A3.5 3.5 0 0 1 15.5 20h-7A3.5 3.5 0 0 1 5 16.5z" />
      <path d="M8 10.5V8.8A4 4 0 0 1 12 5a4 4 0 0 1 4 3.8v1.7" />
    </>
  ),
  festival: (
    <>
      <path d="M12 3.5 14.2 9 20 9.5l-4.4 3.8 1.4 5.7L12 16l-5 3 1.4-5.7L4 9.5 9.8 9z" />
    </>
  ),
  breakfast: (
    <>
      <path d="M5 15.5h14" />
      <path d="M7 12a5 5 0 0 1 10 0" />
      <path d="M12 3.5v3" />
      <path d="m16.5 5.3-1.8 1.9" />
    </>
  ),
  lunch: (
    <>
      <path d="M4.5 12h15" />
      <path d="M7 8.5h10l2 9H5z" />
    </>
  ),
  dinner: (
    <>
      <path d="M6.5 5v14" />
      <path d="M9.5 5v14" />
      <path d="M15 5c2.2 0 4 1.8 4 4v10" />
    </>
  ),
  dessert: (
    <>
      <path d="M7 10h10l-1.2 7.5H8.2z" />
      <path d="M9 10c0-2 1.1-3.5 3-4.5C14 6.5 15 8 15 10" />
      <path d="M10 17.5h4" />
    </>
  ),
  good: (
    <>
      <path d="M12 4.5v15" />
      <path d="M4.5 12h15" />
    </>
  ),
  excellent: (
    <>
      <path d="M12 4.5 14 9.7 19.5 10 15 13.5l1.5 5.5L12 16l-4.5 3 1.5-5.5L4.5 10l5.5-.3z" />
    </>
  ),
  tag: (
    <>
      <path d="M4.5 12 12 4.5h6.5V11L11 18.5 4.5 12Z" />
      <circle cx="15.5" cy="7.5" r="1" />
    </>
  ),
  recipe: (
    <>
      <path d="M6 5.5h12" />
      <path d="M6 10h12" />
      <path d="M6 14.5h8" />
      <path d="M6 19h8" />
    </>
  ),
};

export default function AppIcon({ name, size = 18, strokeWidth = 2.05, className }: AppIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {iconPaths[name]}
    </svg>
  );
}
