import type { Metadata } from "next";
import { Noto_Serif_JP, Quicksand } from "next/font/google";
import "./globals.css";
import AppBackground from "@/components/background/AppBackground";
import PetalField from "@/components/background/PetalField";
import ClientProviders from "@/components/layout/ClientProviders";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const notoSerifJP = Noto_Serif_JP({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Sakhi — Women's Health Companion",
  description: "A serene, privacy-first companion for menstrual cycle tracking, mood loggers, habit trackers, and AI empathetic guidance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${quicksand.variable} ${notoSerifJP.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col relative text-ink-text bg-bg selection:bg-sakura/30">
        <ClientProviders>
          {/* Atmospheric Fixed Layers */}
          <AppBackground />
          <PetalField />
          
          {/* Core Page Content */}
          <div className="relative z-content min-h-screen flex flex-col">
            {children}
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}
