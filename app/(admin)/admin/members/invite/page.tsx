import type { Metadata } from 'next'

import { AddAccountForm } from '@/components/admin/add-account-form'
import { InviteMembers } from '@/components/admin/invite-members'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { requireRole } from '@/lib/auth/guards'

export const metadata: Metadata = { title: 'Add members' }

export default async function AddMembersPage() {
  await requireRole('admin')

  return (
    <>
      <div>
        <h1 className="text-2xl">Add members</h1>
        <p className="mt-1 max-w-[68ch] text-sm text-ink-muted">
          Create accounts for existing members so they don&apos;t have to register themselves.
          Carry a returning member&apos;s details across one at a time, or paste a plain list of
          names and emails for a quick bulk start. Nobody is emailed unless you turn that on, and
          only once the club email system is live.
        </p>
      </div>

      <Tabs defaultValue="one" className="mt-6">
        <TabsList>
          <TabsTrigger value="one">Add one member</TabsTrigger>
          <TabsTrigger value="list">Import a list</TabsTrigger>
        </TabsList>
        <TabsContent value="one" className="pt-4">
          <p className="mb-4 max-w-[68ch] text-sm text-ink-muted">
            For carrying a member over from the old system: fill in whatever you have — only name
            and email are needed, the rest is optional and can be finished later from their record.
          </p>
          <AddAccountForm />
        </TabsContent>
        <TabsContent value="list" className="pt-4">
          <p className="mb-4 max-w-[68ch] text-sm text-ink-muted">
            For standing up many accounts quickly from a list of names and emails. Check it first —
            that changes nothing — then create. Details can be added to each record afterwards.
          </p>
          <InviteMembers />
        </TabsContent>
      </Tabs>
    </>
  )
}
