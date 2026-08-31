import type { Metadata } from 'next'
import { Bricolage_Grotesque, Figtree } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  axes: ['opsz'],
})

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
})

export const metadata: Metadata = {
  title: {
    default: 'Telford Canoe Club',
    template: '%s — Telford Canoe Club',
  },
  description:
    'The club with its own stretch of the Severn — whitewater kayaking, freestyle and paddleboarding from our gated site at Jackfield Rapids, Ironbridge.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en-GB" className={cn('h-full antialiased', bricolage.variable, figtree.variable)}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  )
}
