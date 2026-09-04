import { KeyRound, LifeBuoy, Waves } from 'lucide-react'

import { BridgeArch, ClubBadge } from '@/components/site/brand'

/**
 * DR-07 — the brand half of the auth shell. Layout from 21st.dev "Login"
 * (https://21st.dev/@lavikatiyar/components/login, MIT — two-column form +
 * panel), rebuilt as a deep field with the badge, the club's one-line promise
 * and three membership facts. Sticks beside long forms at ≥1024px; collapses
 * to a slim brand strip above the form on smaller screens.
 */

const facts = [
  { icon: Waves, text: 'Club evening paddles on our own rapid, levels permitting' },
  { icon: LifeBuoy, text: 'Club boats, paddles and buoyancy aids while you find your feet' },
  { icon: KeyRound, text: 'The gate code, notices and documents in the members area' },
]

export function AuthPanel() {
  return (
    <aside
      aria-label="About the club"
      className="relative overflow-hidden bg-deep text-white lg:sticky lg:top-16 lg:h-[calc(100svh-4rem)] lg:w-[42%] lg:max-w-[560px] lg:shrink-0 lg:self-start"
    >
      <BridgeArch className="absolute -right-28 -bottom-8 hidden w-[640px] text-white/[0.08] lg:block" />

      {/* Mobile and tablet: one brand strip */}
      <div className="relative flex items-center gap-3 px-4 py-4 md:px-6 lg:hidden">
        <ClubBadge className="size-9" />
        <p className="text-sm text-stone">
          Your own stretch of the Severn — one account for you or your whole household.
        </p>
      </div>

      {/* Desktop: the full panel */}
      <div className="relative hidden h-full flex-col justify-between p-10 lg:flex xl:p-14">
        <div>
          <ClubBadge className="size-28" detailed />
          <p className="mt-8 max-w-[14ch] font-heading text-[length:var(--text-h2)] leading-[1.15] font-semibold tracking-tight text-balance">
            Your own stretch of the Severn
          </p>
          <p className="mt-3 max-w-[40ch] text-stone">
            One membership covers every discipline at Jackfield — and your account is where it
            lives.
          </p>
        </div>
        <ul className="mt-10 space-y-4 text-sm text-stone">
          {facts.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="pt-1.5">{text}</span>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-micro text-stone/80">
          Jackfield Rapids, The Lloyds, Ironbridge, Telford TF8 7HJ · An affiliated Paddle UK club
        </p>
      </div>
    </aside>
  )
}
