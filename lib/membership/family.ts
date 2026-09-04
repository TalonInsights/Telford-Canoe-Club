import { z } from 'zod'

/**
 * One covered family member as captured at registration — a fuller individual
 * record: their name, date of birth (so juniors are flagged automatically) and
 * their own emergency contact. The account holder is added separately from
 * their profile; this is for everyone else on a family membership.
 */
export const familyMemberSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(120),
  dob: z.string().trim().optional(), // yyyy-mm-dd
  emergencyContactName: z.string().trim().max(120).optional(),
  emergencyContactPhone: z.string().trim().max(30).optional(),
})

export type FamilyMemberInput = z.infer<typeof familyMemberSchema>

/** The jsonb shape request_membership / admin_create_membership expect (0019). */
export function familyPayload(family: FamilyMemberInput[] | undefined) {
  return (family ?? [])
    .filter((f) => f.name.trim().length > 0)
    .map((f) => ({
      name: f.name.trim(),
      dob: f.dob?.trim() || null,
      emergency_contact_name: f.emergencyContactName?.trim() || null,
      emergency_contact_phone: f.emergencyContactPhone?.trim() || null,
    }))
}

/** A covered person as read back for display (payer + each family member). */
export type CoveredMember = {
  user_id: string | null
  display_name: string
  is_junior: boolean
  date_of_birth: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
}
