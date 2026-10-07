import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const cabinet = localFont({
  src: [
    { path: '../styles/fonts/cabinet-500.woff2', weight: '500' },
    { path: '../styles/fonts/cabinet-700.woff2', weight: '700' },
    { path: '../styles/fonts/cabinet-800.woff2', weight: '800' },
  ],
  variable: '--font-cabinet',
})

const satoshi = localFont({
  src: [
    { path: '../styles/fonts/satoshi-400.woff2', weight: '400' },
    { path: '../styles/fonts/satoshi-500.woff2', weight: '500' },
    { path: '../styles/fonts/satoshi-700.woff2', weight: '700' },
  ],
  variable: '--font-satoshi',
})

export const metadata: Metadata = {
  title: 'peekpal: a tiny mascot that watches your page',
  description:
    'A framework-free web component. It follows the cursor, reacts when poked, naps when nobody is around and notices your forms.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cabinet.variable} ${satoshi.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
