import { z } from 'zod'

/**
 * Shared between the P0-22 form blocks and the Phase 3 server actions —
 * the server re-parses with these exact schemas and never trusts the client.
 */

export const ukPostcode = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i

export const signInSchema = z.object({
  email: z.email('Enter the email address you registered with'),
  password: z.string().min(1, 'Enter your password'),
})

export const magicLinkSchema = z.object({
  email: z.email('Enter the email address you registered with'),
})

export const signUpSchema = z
  .object({
    firstName: z.string().trim().min(1, 'Enter your first name'),
    lastName: z.string().trim().min(1, 'Enter your last name'),
    email: z.email('Enter an email address like name@example.org'),
    password: z.string().min(10, 'Use at least 10 characters — a short sentence works well'),
    dateOfBirth: z
      .string()
      .min(1, 'Enter your date of birth')
      .refine((v) => {
        const d = new Date(v)
        return !Number.isNaN(+d) && d < new Date() && d > new Date('1900-01-01')
      }, 'Enter a real date of birth'),
    phone: z.string().trim().min(7, 'Enter a phone number we can reach you on'),
    addressLine1: z.string().trim().min(1, 'Enter the first line of your address'),
    addressLine2: z.string().trim().optional(),
    town: z.string().trim().min(1, 'Enter your town'),
    postcode: z.string().trim().regex(ukPostcode, 'Enter a postcode like TF8 7HJ'),
    bcNumber: z.string().trim().optional(),
    guardianName: z.string().trim().optional(),
    guardianPhone: z.string().trim().optional(),
    acceptRules: z.boolean().refine((v) => v, 'You need to accept the club rules to join'),
    acceptRisk: z.boolean().refine((v) => v, 'You need to acknowledge the risk statement'),
    acceptPrivacy: z.boolean().refine((v) => v, 'You need to accept the privacy policy'),
  })
  .superRefine((data, ctx) => {
    if (isJuniorDob(data.dateOfBirth)) {
      if (!data.guardianName?.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['guardianName'],
          message: "Enter a parent or guardian's full name — required for under-18s",
        })
      }
      if (!data.guardianPhone?.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['guardianPhone'],
          message: "Enter a parent or guardian's phone number",
        })
      }
    }
  })

export type SignInValues = z.infer<typeof signInSchema>
export type MagicLinkValues = z.infer<typeof magicLinkSchema>
export type SignUpValues = z.infer<typeof signUpSchema>

export function isJuniorDob(dob: string): boolean {
  const d = new Date(dob)
  if (Number.isNaN(+d)) return false
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - 18)
  return d > cutoff
}
