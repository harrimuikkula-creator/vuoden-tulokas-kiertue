import type { Metadata, Viewport } from "next";
import { Anton, Manrope } from "next/font/google";
import SetAppHeight from "@/components/SetAppHeight";
import "./globals.css";

const display = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e3278",
};

export const metadata: Metadata = {
  title: "Vuoden Tulokas Stand Up -kiertue",
  description:
    "LUONNOS Seitsemän koomikkoa, kaksi keikkaa — Vuoden Tulokas Stand Up -kiertue. Liput ja teaser tulossa.",
  icons: {
    icon: [
      { url: "/vtsk.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon.ico", type: "image/x-icon", sizes: "48x48" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Vuoden Tulokas Stand Up -kiertue",
    description:
      "LUONNOS Seitsemän koomikkoa, kaksi keikkaa — Vuoden Tulokas Stand Up -kiertue.",
    images: ["/tour-poster.jpg"],
    locale: "fi_FI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fi">
      <body className={`${display.variable} ${body.variable}`}>
        <SetAppHeight />
        {children}
      </body>
    </html>
  );
}
