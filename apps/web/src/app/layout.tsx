import "./globals.css";
import { Anonymous_Pro, IBM_Plex_Sans_JP } from "next/font/google";
import type { Metadata } from "next";
import type { ReactNode } from "react";

type RootLayoutProps = {
  children: ReactNode;
};

const ibmPlexSansJP = IBM_Plex_Sans_JP({
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ibm-plex-sans-jp",
});

const anonymousPro = Anonymous_Pro({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-anonymous-pro",
});

export const metadata: Metadata = {
  title: "校内体育大会2026 - 一関高専",
  description: "令和8年度一関高専校内体育大会の結果速報をお届け！",
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ja">
      <body className={`${ibmPlexSansJP.variable} ${anonymousPro.variable} overflow-x-hidden scrollbar-none`}>
        {children}
      </body>
    </html>
  );
}
