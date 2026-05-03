import type { Metadata } from 'next'
import { Lexend } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/sonner'

const lexend = Lexend({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'KFC Recruitment',
  description: 'Hệ thống tuyển dụng nhân sự KFC',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className={lexend.className}>
        <Providers>{children}</Providers>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
