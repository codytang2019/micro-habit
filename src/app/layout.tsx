import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Micro Habit",
  description: "Track and build micro habits, one day at a time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-white text-neutral-900">
        {children}
      </body>
    </html>
  );
}
