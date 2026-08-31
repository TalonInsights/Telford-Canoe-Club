/**
 * P0-11 — shadcn Accordion in the two-column layout referenced from 21st.dev
 * "Accordion" (https://21st.dev/@brijr/components/accordion-1, MIT): heading
 * and intro in the left column, single-open accordion in the right. Collapses
 * to one column on mobile.
 */

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export type Faq = { question: string; answer: React.ReactNode }

export function FaqAccordion({
  title,
  intro,
  faqs,
}: {
  title: string
  intro?: string
  faqs: Faq[]
}) {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <h2>{title}</h2>
        {intro && <p className="mt-2 max-w-[68ch] text-ink-muted">{intro}</p>}
      </div>
      <Accordion type="single" collapsible className="lg:col-span-7">
        {faqs.map((faq) => (
          <AccordionItem key={faq.question} value={faq.question}>
            <AccordionTrigger className="min-h-11 text-left text-base">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="max-w-[68ch] text-ink-muted">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
