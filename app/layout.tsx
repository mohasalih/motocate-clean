import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Moto Care Pro — Garage Management',
  description: 'Complete garage management system for service centers',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
