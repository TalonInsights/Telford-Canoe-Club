'use client'

import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { adminCreateAccountsAction, type RowOutcome } from '@/lib/actions/accounts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'

/**
 * Create accounts for existing members from the old member list (5.5/5.6).
 * Paste one person per line; check it first (a dry run that writes nothing);
 * then create. The invite email is off by default and clearly flagged, so a
 * test import cannot reach a real inbox.
 */

type ParsedRow = { firstName: string; lastName: string; email: string }

function parse(text: string): { rows: ParsedRow[]; bad: string[] } {
  const rows: ParsedRow[] = []
  const bad: string[] = []
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    const parts = line.split(',').map((p) => p.trim()).filter(Boolean)
    let row: ParsedRow | null = null
    if (parts.length >= 3 && parts[2].includes('@')) {
      row = { firstName: parts[0], lastName: parts[1], email: parts[2] }
    } else if (parts.length === 2 && parts[1].includes('@')) {
      const name = parts[0].split(/\s+/)
      row = { firstName: name[0] ?? '', lastName: name.slice(1).join(' ') || name[0] || '', email: parts[1] }
    }
    if (row && row.firstName && row.lastName && row.email.includes('@')) rows.push(row)
    else bad.push(line)
  }
  return { rows, bad }
}

const outcomeBadge: Record<RowOutcome['outcome'], { label: string; variant: 'success' | 'warn' | 'signal' | 'outline' }> = {
  'would-create': { label: 'Will create', variant: 'signal' },
  created: { label: 'Created', variant: 'success' },
  invited: { label: 'Created + invited', variant: 'success' },
  'already-exists': { label: 'Already has an account', variant: 'outline' },
  error: { label: 'Problem', variant: 'warn' },
}

export function InviteMembers() {
  const [text, setText] = useState('')
  const [sendInvites, setSendInvites] = useState(false)
  const [pending, startTransition] = useTransition()
  const [results, setResults] = useState<RowOutcome[] | null>(null)
  const [wasDryRun, setWasDryRun] = useState(false)

  const { rows, bad } = useMemo(() => parse(text), [text])

  const submit = (dryRun: boolean) =>
    startTransition(async () => {
      setResults(null)
      const result = await adminCreateAccountsAction({ rows, dryRun, sendInvites: dryRun ? false : sendInvites })
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      setResults(result.rows)
      setWasDryRun(result.dryRun)
      if (!result.dryRun) {
        const made = result.rows.filter((r) => r.outcome === 'created' || r.outcome === 'invited').length
        toast.success(`${made} account${made === 1 ? '' : 's'} created`)
        if (sendInvites && !result.emailLive) {
          toast.message('Invites were not sent: the club email system is not live yet (D5).')
        }
      }
    })

  return (
    <div className="grid gap-4">
      <section className="rounded-xl border border-stone bg-card p-5">
        <label htmlFor="im-list" className="text-sm font-medium">
          One person per line
        </label>
        <p className="mt-1 text-micro text-ink-muted">
          First name, last name, email — for example{' '}
          <span className="font-mono">Jo, Bloggs, jo@example.org</span>. Lines that don&apos;t fit
          are skipped and listed below.
        </p>
        <Textarea
          id="im-list"
          rows={8}
          className="mt-3 font-mono text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'Jo, Bloggs, jo@example.org\nSam, Rivers, sam@example.org'}
        />
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-micro text-ink-muted">
          <span>{rows.length} ready</span>
          {bad.length > 0 && <span className="text-warn">{bad.length} line(s) could not be read</span>}
        </div>
        {bad.length > 0 && (
          <ul className="mt-2 grid gap-0.5 text-micro text-ink-muted">
            {bad.slice(0, 8).map((b, i) => (
              <li key={i} className="truncate font-mono">
                {b}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-stone bg-card p-5">
        <label className="flex items-start gap-2.5 text-sm">
          <Checkbox checked={sendInvites} onCheckedChange={(v) => setSendInvites(!!v)} className="mt-0.5" />
          <span>
            Email each new person a link to set their password
            <span className="mt-0.5 block text-micro text-ink-muted">
              Leave this off for test imports. Invites only actually send once the club email
              system is live, but keep it off until you mean to contact real members.
            </span>
          </span>
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" disabled={pending || rows.length === 0} onClick={() => submit(true)}>
            {pending ? 'Checking…' : 'Check (no changes)'}
          </Button>
          <Button variant="signal" disabled={pending || rows.length === 0} onClick={() => submit(false)}>
            {pending ? 'Working…' : `Create ${rows.length || ''} account${rows.length === 1 ? '' : 's'}`}
          </Button>
        </div>
      </section>

      {results && (
        <section className="rounded-xl border border-stone bg-card p-5">
          <h2 className="text-lg">{wasDryRun ? 'Dry run — nothing was changed' : 'Done'}</h2>
          <ul className="mt-3 grid gap-2">
            {results.map((r, i) => {
              const b = outcomeBadge[r.outcome]
              return (
                <li key={i} className="flex flex-wrap items-center justify-between gap-2 border-b border-stone pb-2 text-sm last:border-b-0">
                  <span>
                    <span className="font-medium">{r.name}</span>{' '}
                    <span className="text-ink-muted">{r.email}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    {r.detail && <span className="text-micro text-ink-muted">{r.detail}</span>}
                    <Badge variant={b.variant}>{b.label}</Badge>
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
