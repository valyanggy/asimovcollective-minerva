import React from "react"
import type { Metadata } from 'next'

import './globals.css'

export const metadata: Metadata = {
  title: 'Minerva Particle Study',
  description: 'Image-native 3D particle relief visualization',
}

export const viewport = {
  themeColor: '#0a0c10',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
