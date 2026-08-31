'use client'

import { useState } from 'react'

import {
  CalendarDays,
  Check,
  CircleAlert,
  FileText,
  Home,
  Info,
  LifeBuoy,
  Mail,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'

import { type ColumnDef } from '@tanstack/react-table'

import { DataTable, exportCsv, selectionColumn } from '@/components/admin/data-table'
import { StatCard } from '@/components/admin/stat-card'
import { SignInForm, SignUpForm } from '@/components/site/auth-forms'
import { CommitteeGrid } from '@/components/site/committee-grid'
import { EventCalendar } from '@/components/site/event-calendar'
import { ImageGallery } from '@/components/site/image-gallery'
import { DatePicker, DateTimePicker } from '@/components/ui/date-picker'
import { FileUpload } from '@/components/ui/file-upload'
import { FaqAccordion } from '@/components/site/faq-accordion'
import { PricingTiers } from '@/components/site/pricing-tiers'
import { Timeline } from '@/components/site/timeline'
import { EmptyState } from '@/components/ui/empty-state'
import { Stepper } from '@/components/ui/stepper'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster } from '@/components/ui/sonner'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type DemoMember = { name: string; tier: string; status: string; paid: string }

const demoMembers: DemoMember[] = [
  { name: 'S. Wiles', tier: 'Adult', status: 'Active', paid: '£25' },
  { name: 'J. Rapids', tier: 'Family', status: 'Expiring soon', paid: '£40' },
  { name: 'A. Weir', tier: 'Junior', status: 'Active', paid: '£15' },
]

const demoColumns: ColumnDef<DemoMember>[] = [
  selectionColumn<DemoMember>(),
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'tier', header: 'Tier' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'paid', header: 'Paid' },
]

function fakeUpload(_file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve) => {
    let pct = 0
    const t = setInterval(() => {
      pct += 20
      onProgress(Math.min(pct, 100))
      if (pct >= 100) {
        clearInterval(t)
        resolve()
      }
    }, 150)
  })
}

const nextThursday = (() => {
  const d = new Date()
  d.setDate(d.getDate() + ((4 - d.getDay() + 7) % 7 || 7))
  d.setHours(17, 30, 0, 0)
  return d
})()

function Swatch({ name, cls, hex }: { name: string; cls: string; hex: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`size-8 rounded-lg border border-stone ${cls}`} />
      <span className="text-sm">
        {name} <span className="text-ink-muted">{hex}</span>
      </span>
    </div>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="rounded-xl border border-stone bg-card p-6">
      <h3 className="mb-4">{title}</h3>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  )
}

export default function UiGallery() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-12">
      <h1>Primitive gallery</h1>
      <p className="mt-2 mb-8 max-w-[68ch] text-ink-muted">
        Development reference for every tokenised shadcn primitive (P0-04). Removed before launch
        (P12-02).
      </p>

      <div className="grid gap-6">
        <Block title="Tokens">
          <Swatch name="deep" cls="bg-deep" hex="#0E2F3C" />
          <Swatch name="river" cls="bg-river" hex="#1F5F6E" />
          <Swatch name="foam" cls="bg-foam" hex="#F3F6F5" />
          <Swatch name="stone" cls="bg-stone" hex="#DCE3E1" />
          <Swatch name="ink" cls="bg-ink" hex="#14232A" />
          <Swatch name="signal" cls="bg-signal" hex="#C93518" />
          <Swatch name="signal-soft" cls="bg-signal-soft" hex="#FCEEEB" />
          <Swatch name="success" cls="bg-success" hex="#1E7F4F" />
          <Swatch name="warn" cls="bg-warn" hex="#8A5A12" />
        </Block>

        <Block title="Button — variants and sizes (36 / 44 / 52)">
          <Button size="sm">Save changes</Button>
          <Button>Save changes</Button>
          <Button size="lg">Save changes</Button>
          <Button variant="signal">Book now</Button>
          <Button variant="secondary">See what&apos;s on</Button>
          <Button variant="outline">Cancel booking</Button>
          <Button variant="ghost">Back</Button>
          <Button variant="destructive">Delete page</Button>
          <Button variant="link">Read the policy</Button>
          <Button disabled>Saving…</Button>
          <Button size="icon" aria-label="Open calendar">
            <CalendarDays />
          </Button>
        </Block>

        <Block title="Badge — status is word + colour + icon">
          <Badge variant="success">
            <Check /> Active
          </Badge>
          <Badge variant="warn">
            <CircleAlert /> Expiring soon
          </Badge>
          <Badge variant="signal">
            <Info /> Payment pending
          </Badge>
          <Badge>Committee</Badge>
          <Badge variant="secondary">Family</Badge>
          <Badge variant="outline">2026</Badge>
        </Block>

        <Block title="Input, textarea, select — 44px controls">
          <div className="grid w-full max-w-sm gap-2">
            <label className="text-sm font-medium" htmlFor="ui-postcode">
              Postcode
            </label>
            <Input id="ui-postcode" placeholder="TF8 7HJ" />
            <p className="text-micro text-ink-muted">As it appears on your Paddle UK record</p>
          </div>
          <div className="grid w-full max-w-sm gap-2">
            <label className="text-sm font-medium" htmlFor="ui-disabled">
              Disabled state
            </label>
            <Input id="ui-disabled" disabled value="Locked while sending" readOnly />
          </div>
          <div className="grid w-full max-w-sm gap-2">
            <label className="text-sm font-medium" htmlFor="ui-notes">
              Notes
            </label>
            <Textarea id="ui-notes" placeholder="Anything the organiser should know" />
          </div>
          <Select>
            <SelectTrigger className="w-56" aria-label="Membership tier">
              <SelectValue placeholder="Choose a tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="adult">Adult — £25</SelectItem>
              <SelectItem value="junior">Junior — £15</SelectItem>
              <SelectItem value="family">Family — £40</SelectItem>
            </SelectContent>
          </Select>
        </Block>

        <Block title="Checkbox, radio, switch">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox defaultChecked /> I accept the club rules
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox disabled /> Disabled
          </label>
          <RadioGroup defaultValue="adult" className="flex gap-4" aria-label="Tier">
            <label className="flex items-center gap-2 text-sm">
              <RadioGroupItem value="adult" /> Adult
            </label>
            <label className="flex items-center gap-2 text-sm">
              <RadioGroupItem value="junior" /> Junior
            </label>
          </RadioGroup>
          <label className="flex items-center gap-2 text-sm">
            <Switch defaultChecked /> Email me club news
          </label>
        </Block>

        <Block title="Dialog, sheet, tooltip, popover, dropdown, toast">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send to 84 members?</DialogTitle>
                <DialogDescription>
                  This sends the gate code notice to every current paid member.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button>Send now</Button>
                <Button variant="ghost">Cancel</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Open sheet</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>Narrow the member list.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Help">
                  <LifeBuoy />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Water levels update hourly</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Open popover</Button>
            </PopoverTrigger>
            <PopoverContent className="text-sm">
              Bookings close 24 hours before the session starts.
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Actions</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Record payment</DropdownMenuItem>
              <DropdownMenuItem>Extend membership</DropdownMenuItem>
              <DropdownMenuItem variant="destructive">Cancel membership</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="secondary" onClick={() => toast.success('Changes saved')}>
            Show toast
          </Button>
        </Block>

        <Block title="Tabs, accordion, breadcrumb, pagination">
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="pt-2 text-sm text-ink-muted">
              Three sessions this week.
            </TabsContent>
            <TabsContent value="past" className="pt-2 text-sm text-ink-muted">
              Forty national slaloms and counting.
            </TabsContent>
          </Tabs>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="a">
              <AccordionTrigger>Do I need my own kayak?</AccordionTrigger>
              <AccordionContent>
                No — club boats and paddles are available for members at every session.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Events</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#prev" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#1" isActive>
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#2">2</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#next" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </Block>

        <Block title="Table, skeleton, avatar, empty pattern">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>S. Wiles</TableCell>
                <TableCell>Adult</TableCell>
                <TableCell>
                  <Badge variant="success">
                    <Check /> Active
                  </Badge>
                </TableCell>
                <TableCell className="text-right">£25.00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>J. Rapids</TableCell>
                <TableCell>Family</TableCell>
                <TableCell>
                  <Badge variant="warn">
                    <CircleAlert /> Expiring soon
                  </Badge>
                </TableCell>
                <TableCell className="text-right">£40.00</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>SW</AvatarFallback>
            </Avatar>
            <Skeleton className="h-11 w-40" />
            <Skeleton className="size-11 rounded-full" />
          </div>
        </Block>

        <Block title="PricingTiers">
          <PricingTiers
            tiers={[
              {
                name: 'Single adult',
                pricePence: 2500,
                description: 'For paddlers aged 18 and over.',
                features: ['All club sessions', 'Club boats and kit', 'Members-only documents'],
                href: '/register',
                cta: 'Join as an adult',
              },
              {
                name: 'Single junior',
                pricePence: 1500,
                description: 'Under 18, with a parent or guardian on record.',
                features: ['All junior sessions', 'Club boats and kit', 'Coaching support'],
                href: '/register',
                cta: 'Join as a junior',
              },
              {
                name: 'Family',
                pricePence: 4000,
                description: 'Everyone in one household.',
                features: ['All club sessions', 'Club boats and kit', 'One renewal for everyone'],
                href: '/register',
                cta: 'Join as a family',
              },
            ]}
          />
        </Block>

        <Block title="FaqAccordion">
          <FaqAccordion
            title="Common questions"
            intro="Single-open accordion, two-column at desktop."
            faqs={[
              {
                question: 'Do I need my own kayak?',
                answer: 'No — club boats and paddles are available for members at every session.',
              },
              {
                question: 'When does membership run to?',
                answer: 'Every membership runs to 31 December, whenever you join.',
              },
            ]}
          />
        </Block>

        <Block title="CommitteeGrid — holder and vacant variants">
          <CommitteeGrid
            roles={[
              { roleTitle: 'Chair', holderName: 'Simon Wiles' },
              { roleTitle: 'Welfare officer', holderName: null },
              { roleTitle: 'Treasurer', holderName: null },
              { roleTitle: 'Secretary', holderName: null },
            ]}
          />
        </Block>

        <Block title="Stepper — register → tier → pay">
          <Stepper steps={['Create account', 'Choose tier', 'Pay']} current={1} />
        </Block>

        <Block title="StatCard">
          <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Paid members" value={84} icon={Users} hint="Across all tiers" />
            <StatCard
              label="Expiring in 30 days"
              value={12}
              icon={CircleAlert}
              tone="warn"
              hint="Renewals due"
            />
            <StatCard
              label="Unpaid registrations"
              value={7}
              icon={Mail}
              tone="signal"
              hint="Never paid"
            />
            <StatCard label="Documents due review" value={3} icon={FileText} />
          </div>
        </Block>

        <Block title="Timeline">
          <Timeline
            entries={[
              { marker: '1960s', title: 'A hut below the Black Swan' },
              {
                marker: '1987',
                title: 'The Jackfield lease',
                description: 'Army reserves built the roads, parking, toilets and containers.',
              },
              { marker: 'Today', title: '40 national slaloms and counting' },
            ]}
          />
        </Block>

        <Block title="EmptyState">
          <EmptyState
            icon={Home}
            title="Nothing scheduled"
            description="Check back soon, or join the club to hear first."
            action={<Button variant="secondary">See membership</Button>}
            className="w-full"
          />
        </Block>
        <Block title="EventCalendar — month grid, mobile list under 640px">
          <div className="w-full">
            <EventCalendar
              events={[
                {
                  id: '1',
                  slug: 'club-evening-paddle',
                  title: 'Club evening paddle',
                  category: 'club_night',
                  startsAt: nextThursday,
                },
                {
                  id: '2',
                  slug: 'pool-session',
                  title: 'Pool session',
                  category: 'pool',
                  startsAt: new Date(+nextThursday + 3 * 86400000),
                },
              ]}
            />
          </div>
        </Block>

        <Block title="DatePicker and DateTimePicker">
          <DatePickerDemo />
        </Block>

        <Block title="FileUpload — simulated 20MB image uploads">
          <FileUpload accept={['image/jpeg', 'image/png', 'image/webp']} upload={fakeUpload} />
        </Block>

        <Block title="ImageGallery — lightbox + click-to-load video tile">
          <div className="w-full">
            <ImageGallery
              items={[
                {
                  kind: 'image',
                  src: '/images/placeholders/hero-jackfield.jpg',
                  alt: 'Jackfield Rapids from above',
                  caption: 'Jackfield Rapids',
                },
                {
                  kind: 'video',
                  embedUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                  title: 'Freestyle session highlights',
                },
              ]}
            />
          </div>
        </Block>

        <Block title="DataTable — sort, select, CSV export">
          <div className="w-full">
            <DataTable
              columns={demoColumns}
              data={demoMembers}
              countLabel={(n) => `${n} members`}
              bulkActions={(rows) => (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    exportCsv(
                      'members.csv',
                      rows.map((r) => ({ ...r }))
                    )
                  }
                >
                  Export CSV
                </Button>
              )}
            />
          </div>
        </Block>

        <Block title="SignInForm">
          <SignInForm
            onPassword={async (v) => {
              toast.success(`Would log in ${v.email}`)
            }}
            onMagicLink={async (v) => {
              toast.success(`Would email a link to ${v.email}`)
            }}
          />
        </Block>

        <Block title="SignUpForm — junior fields appear from date of birth">
          <SignUpForm onSubmit={async (v) => {
              toast.success(`Would register ${v.email}`)
            }} />
        </Block>
      </div>
      <Toaster />
    </main>
  )
}

function DatePickerDemo() {
  const [date, setDate] = useState<Date | undefined>()
  const [when, setWhen] = useState<Date | undefined>()
  return (
    <div className="grid w-full max-w-md gap-4">
      <DatePicker value={date} onChange={setDate} />
      <DateTimePicker value={when} onChange={setWhen} />
    </div>
  )
}
