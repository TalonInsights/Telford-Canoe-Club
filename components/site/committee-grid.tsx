/**
 * P0-12 — grid pattern from 21st.dev "Members Grid Block"
 * (https://21st.dev/@shadcnui-blocks/components/members-03, MIT); search and
 * invite chrome stripped. Adds the §3.6 vacant-role variant ("Vacant: could
 * this be you?" linking to the role descriptions). Photos come from the
 * committee editor (`committee_roles.photo_path`, 8 Sep 2026); initials fill
 * the same tile until one is added, so the grid stays even. Below 640px the
 * card is a compact row (picture beside the words), above it a portrait tile.
 * No social icons by policy.
 */

import Image from 'next/image'
import Link from 'next/link'

import { FullGrid } from '@/components/layout/grids'
import { cn } from '@/lib/utils'

export type CommitteeRole = {
  roleTitle: string
  holderName?: string | null
  description?: string
  photoUrl?: string | null
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
          <article
            key={role.roleTitle}
            className="flex h-full gap-4 rounded-xl border border-stone bg-card p-4 sm:flex-col sm:p-5"
          >
            <div
              className={cn(
                'relative size-20 shrink-0 overflow-hidden rounded-lg sm:aspect-square sm:h-auto sm:w-full',
                vacant ? 'bg-foam text-ink-muted' : 'bg-river text-white'
              )}
            >
              {role.photoUrl ? (
                <Image
                  src={role.photoUrl}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 300px, (min-width: 640px) 50vw, 80px"
                  className="object-cover"
                />
              ) : (
                <span
                  className="flex size-full items-center justify-center font-heading text-2xl sm:text-4xl"
                  aria-hidden="true"
                >
                  {vacant ? '?' : initials(role.holderName as string)}
                </span>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <h3 className="text-lg">{role.roleTitle}</h3>
              {vacant ? (
                <p className="text-sm text-ink-muted">
                  Vacant:{' '}
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
          </article>
        )
      })}
    </FullGrid>
  )
}
