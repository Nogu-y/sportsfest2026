import "./globals.css";
import type { Metadata } from 'next';
import type { ReactNode } from 'react'

type RootLayoutProps = {
  children: ReactNode
}

export const metadata: Metadata = {
    title: "校内体育大会2026 - 一関高専",
    description: "令和8年度一関高専校内体育大会の結果速報をお届けします！",
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
