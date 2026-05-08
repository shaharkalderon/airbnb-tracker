import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

const display = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "DorisDayInn",
  description: "Property tracker — bookings, income & expenses",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#FF385C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme")?.value === "dark" ? "dark" : "light";
  return (
    <html lang="en" className={`${display.variable} h-full antialiased`} data-theme={theme}>
      <body className="min-h-full bg-[var(--bg)] text-[var(--fg)]">{children}</body>
    </html>
  );
}
