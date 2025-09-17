import type { Metadata } from "next";
import { IBM_Plex_Mono, Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Smit Dhameliya | Packet Atlas",
  description:
    "Packet Atlas is the living network map of Smit Dhameliya's full-stack universe across web, mobile, and IoT.",
  openGraph: {
    title: "Packet Atlas | Smit Dhameliya",
    description:
      "Navigate the realtime network of projects, stacks, and IoT adventures designed by full-stack developer Smit Dhameliya.",
    url: "https://packet-atlas.dev",
    siteName: "Packet Atlas",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Packet Atlas | Smit Dhameliya",
    description:
      "Trace packets through Smit Dhameliya's projects, stacks, and IoT systems in a living network map.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${sora.variable} ${plexMono.variable} antialiased bg-[#0B0D12]`}
      >
        {children}
      </body>
    </html>
  );
}
