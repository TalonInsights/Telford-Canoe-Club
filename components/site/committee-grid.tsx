/**
 * P0-12 — grid pattern from 21st.dev "Members Grid Block"
 * (https://21st.dev/@shadcnui-blocks/components/members-03, MIT); search and
 * invite chrome stripped. Adds the §3.6 vacant-role variant: "Vacant — could
 * this be you?" linking to the role descriptions. Initials avatars until the
 * club supplies headshots (D11); no social icons by policy.
 */

import Link from 'next/link'

import { FullGrid } from '@/components/layout/grids'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export type CommitteeRole = {
  roleTitle: string
  holderName?: string | null
  description?: string
  avatarUrl?: string | null
  contactEmail?: string | null
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function CommitteeGrid({ roles }: { roles: CommitteeRole[] }) {
  return (
    <FullGrid maxColumns={4}>
      {roles.map((role) => {
        const vacant = !role.holderName
        return (
          <div
            key={role.roleTitle}
            className="flex h-full flex-col items-start rounded-xl border border-stone bg-card p-5"
          >
            <Avatar className="size-14">
              {role.avatarUrl && <AvatarImage src={role.avatarUrl} alt="" />}
              <AvatarFallback className="bg-river text-base text-white">
                {vacant ? '?' : initials(role.holderName as string)}
              </AvatarFallback>
            </Avatar>
            <h3 className="mt-3 text-lg">{role.roleTitle}</h3>
            {vacant ? (
              <p className="text-sm text-ink-muted">
                Vacant —{' '}
                <Link
                  href="/about/role-descriptions"
                  className="font-medium text-river underline-offset-4 hover:underline"
                >
                  could this be you?
                </Link>
              </p>
            ) : (
              <p className="text-sm font-medium">{role.holderName}</p>
            )}
            {role.description && (
              <p className="mt-2 line-clamp-3 text-sm text-ink-muted">{role.description}</p>
            )}
            {role.contactEmail && (
              <a
                href={`mailto:${role.contactEmail}`}
                className="mt-auto pt-3 text-micro text-river underline-offset-4 hover:underline"
              >
                {role.contactEmail}
              </a>
            )}
          </div>
        )
      })}
    </FullGrid>
  )
}
