import type { Metadata } from 'next'

import { FaqEditor } from '@/components/admin/faq-editor'
import { requireRole } from '@/lib/auth/guards'
import { getAllFaqs } from '@/lib/queries/faqs'

export const metadata: Metadata = { title: 'FAQ' }

export default async function AdminFaqPage() {
  const [, faqs] = await Promise.all([requireRole('committee'), getAllFaqs()])

  return (
    <>
      <div>
        <h1 className="text-2xl">FAQ</h1>
        <p className="mt-1 max-w-[68ch] text-sm text-ink-muted">
          The questions and answers shown on the contact page. Reorder them with the arrows; a
          question that is not shown stays hidden from the public but visible here.
        </p>
      </div>
      <div className="mt-6">
        <FaqEditor initial={faqs} />
      </div>
    </>
  )
}
