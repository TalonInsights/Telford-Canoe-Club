import { BridgeArch, ClubBadge, Wordmark } from '@/components/site/brand'

/** Brand proving ground — removed with the other /dev routes before launch (P12-02). */
export default function BrandDevPage() {
  return (
    <main className="min-h-svh bg-foam p-8 text-ink">
      <h1 className="text-2xl">Brand mark</h1>
      <div className="mt-6 flex flex-wrap items-end gap-8">
        <ClubBadge className="size-8" />
        <ClubBadge className="size-10" />
        <ClubBadge className="size-16" />
        <ClubBadge className="size-24" detailed />
        <ClubBadge className="size-48" detailed />
        <ClubBadge className="size-72" detailed />
      </div>
      <div className="mt-8 flex flex-wrap items-end gap-8 rounded-xl bg-deep p-8 text-white">
        <ClubBadge className="size-8" />
        <ClubBadge className="size-10" />
        <ClubBadge className="size-16" />
        <ClubBadge className="size-48" detailed />
        <div className="flex items-center gap-3">
          <ClubBadge className="size-10" />
          <Wordmark />
        </div>
      </div>
      <div className="relative mt-8 h-72 overflow-hidden rounded-xl bg-deep text-white">
        <BridgeArch className="absolute -right-10 bottom-0 w-[560px] text-white/10" />
        <p className="relative p-8 font-heading text-2xl font-semibold">Arch motif over deep</p>
      </div>
    </main>
  )
}
