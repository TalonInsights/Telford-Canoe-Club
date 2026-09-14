'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import { setUserRoleAction } from '@/lib/actions/roles'
import { appRoles, roleHints, roleLabels, type AppRole } from '@/lib/auth/roles'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/**
 * What this person can do on the site, changed by an admin.
 *
 * Every role says what it means in plain words, because the difference between
 * committee and admin is not guessable from the names, and picking the wrong
 * one hands somebody the club's prices and audit log.
 *
 * Granting or removing admin asks twice. Everything below it does not — the
 * club changes members and committee often enough that a dialog every time
 * would just be clicked through.
 */

export function RoleControl({
  userId,
  memberName,
  currentRole,
  isSelf,
}: {
  userId: string
  memberName: string
  currentRole: AppRole
  isSelf: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState<AppRole | null>(null)

  const apply = (role: AppRole) =>
    startTransition(async () => {
      const result = await setUserRoleAction({ userId, role })
      setConfirming(null)
      if (result.ok) {
        toast.success(result.message ?? 'Role changed')
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })

  const choose = (role: AppRole) => {
    if (role === currentRole) return
    if (role === 'admin' || currentRole === 'admin') setConfirming(role)
    else apply(role)
  }

  return (
    <section className="rounded-xl border border-stone bg-card p-5 lg:col-span-2">
      <h2 className="flex items-center gap-2 text-lg">
        <ShieldCheck aria-hidden="true" className="size-5 text-river" />
        What they can do on the site
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        {isSelf
          ? 'This is your own account. Another admin has to change your role, so that nobody can lock the club out of its own site.'
          : `Changing this takes effect the next time ${memberName.split(' ')[0] || 'they'} loads a page. Every change is kept in the audit log.`}
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {appRoles.map((role) => {
          const active = role === currentRole
          return (
            <button
              key={role}
              type="button"
              aria-pressed={active}
              disabled={isSelf || pending || active}
              onClick={() => choose(role)}
              className={cn(
                'rounded-lg border p-3 text-left transition-colors',
                active ? 'border-river bg-foam' : 'border-stone',
                !active && !isSelf && !pending && 'hover:border-river',
                isSelf && !active && 'opacity-60'
              )}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="font-medium">{roleLabels[role]}</span>
                {active && <span className="text-micro font-medium text-river">Current</span>}
              </span>
              <span className="mt-0.5 block text-micro text-ink-muted">{roleHints[role]}</span>
            </button>
          )
        })}
      </div>

      <Dialog open={confirming !== null} onOpenChange={(open) => !open && setConfirming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirming === 'admin'
                ? `Make ${memberName} an admin?`
                : `Take admin away from ${memberName}?`}
            </DialogTitle>
            <DialogDescription>
              {confirming === 'admin'
                ? 'An admin can change the club settings and membership prices, read the audit log, and promote or remove other admins, including you.'
                : `They keep ${confirming ? roleLabels[confirming].toLowerCase() : ''} access and lose the settings, prices, audit log and these role controls.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(null)}>
              Not yet
            </Button>
            <Button
              variant={confirming === 'admin' ? 'signal' : 'destructive'}
              disabled={pending}
              onClick={() => confirming && apply(confirming)}
            >
              {pending ? 'Saving…' : confirming === 'admin' ? 'Make them an admin' : 'Remove admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
