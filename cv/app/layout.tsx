import type { Metadata } from 'next'

// These styles apply to every route in the application
import './globals.css'

export const metadata: Metadata = {
  title: 'Zall.DEV',
  description: 'Zall\'s personal website',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={metadata.description!} />
        <title>{metadata.title?.toString()}</title>
        <link rel="icon" type="image/png" sizes="16x16" href="/favico_16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favico_32x32.png" />
        <link rel="icon" type="image/png" sizes="64x64" href="/favico_64x64.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}