import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Boxart",
  description: "A social diary for the games you play.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
