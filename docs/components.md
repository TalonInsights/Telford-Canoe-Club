# Component sourcing log

Per spec §3.6: primitives from shadcn/ui, blocks from 21st.dev after a live
search; nothing used as-installed; every adaptation recorded here.

Tooling note (P0-02): 21st.dev is reached through the **21st MCP already
connected to Claude Code** (the spec's sanctioned MCP route). Live-search
acceptance verified 31 Aug 2026: `search "data table"` returned 5 candidates
(shadcn Data Table, originui Table, et al.). shadcn CLI is v4.19 — its `-b`
flag now selects the primitive library, so init ran as
`shadcn init -b radix -p vega --css-variables` (baseColor neutral); all colours
are overridden by the `--tcc-*` tokens in P0-03 regardless of preset.

| Component | Source URL | Author | Licence | Score (a11y/clarity/fit/mobile/deps) | Changes |
|---|---|---|---|---|---|
| Button | https://ui.shadcn.com/docs/components/button (`shadcn add button`, radix-vega) | shadcn | MIT | primitive — protocol n/a | Sizes → sm 36 / md 44 / lg 52 (spec), text 16px at md+, 8px control radius, added `signal` CTA variant, `link`→river, removed dark/xs |
| Badge | shadcn add badge | shadcn | MIT | primitive | 13px `text-micro` floor (spec micro step), h-6, added `success`/`warn`/`signal` word+colour+icon status variants |
| Input | shadcn add input | shadcn | MIT | primitive | h-11 (44px), 8px radius, white field on foam, 16px at all widths |
| Textarea | shadcn add textarea | shadcn | MIT | primitive | Same field treatment, min-h-24 |
| Select | shadcn add select | shadcn | MIT | primitive | Trigger 44px default / 36px sm, 8px radius, white field, 16px text |
| Tabs | shadcn add tabs | shadcn | MIT | primitive | Inactive trigger `text-foreground/60` → `text-muted-foreground` (`#4F5A5F`) — axe caught 3.92:1 on stone |
| Checkbox, RadioGroup, Switch, Dialog, Sheet, Tooltip, Popover, DropdownMenu, Skeleton, Toast (sonner), Avatar, Accordion, Breadcrumb, Pagination, Table | shadcn add … | shadcn | MIT | primitives | Inherit TCC palette via the semantic variable mapping in `globals.css` (primary→deep, secondary→river, ring→river, border→stone, destructive→signal); no per-file overrides needed yet |

Verification (P0-04): all primitives rendered with default/disabled/checked/loading
states on `/dev/ui`; axe (wcag2a+2aa+21aa+22aa) → **0 violations**, 31 rule passes.

| Header + MobileNav | https://21st.dev/@shadcnblockscom/components/shadcnblocks-com-navbar1 (live search "sticky navbar with mobile sheet drawer"; runners-up: Navbar 5 same author 21/25; rejected: Floating Header — floating not solid; Adaptive Notch — gimmick) | shadcnblocks | MIT | 4/4/4/4/5 = 21 | Rebuilt on TCC primitives: deep solid sticky bar, signal active underline + `aria-current`, Next `Link`/`usePathname`, radix Sheet drawer (focus trap verified: focus moves in, Escape closes), 44px targets, CTA slot, sentence case; dropdown layer dropped (nav is flat until CMS nav in P7-05) |
| Footer | https://21st.dev/@mvp_Subha/components/footer-column (live search "simple footer three columns"; rejected: solaceui Footer 3 — newsletter form; Stacked Circular — social-only; Sticky Footer — animated gimmick) | mvp_Subha | MIT | 3/3/4/3/5 = 18 | Rebuilt: deep tone, stone secondary text (10.8:1), address + Paddle UK affiliation + policy links, role alias email only, 36px link targets |
| HomeHero | https://21st.dev/@tommyjepsen/components/hero-with-image-text-and-two-buttons (live search "hero with background image overlay left aligned two buttons"; rejected: Hero 1 — gradient/badge not image; Animated hero — rotating-word gimmick) | tommyjepsen | MIT | 4/4/4/4/5 = 21 | Rebuilt: fixed 72/80svh, 65% deep overlay, left-aligned grid text, one orchestrated reveal (module flag, once per full load), useReducedMotion → static, mobile crop via object-position. NOTE: reveal completion unverifiable in embedded pane (rAF starved) — visually QA on deployed URL |
| SportCard / NewsCard / EventCard | https://21st.dev/@shadcnblockscom/components/blog8 (live search "image card with title description and meta row"; rejected: neobrutalism Image Card — wrong style; Scroll Cards — scroll animation; Metadata Preview — gimmick) | shadcnblocks | MIT | 4/4/4/4/5 = 20 | One CardShell anatomy (§3.4): 3:2 image (ImageFallback when missing), h3, 2-line clamp, meta, mt-auto footer; whole-card link with focus ring; equal heights proven at 375/1280 with mismatched copy |
| PricingTiers | https://21st.dev/@kokonutd/components/pricing-cards (live search "three tier pricing cards simple feature list"; rejected: efferd — glassmorphism; lyanchouss — brand-specific) | kokonutd | MIT | 4/4/3/4/4 = 19 | Rebuilt: no toggle, no ribbon, no gradients; Adult/Junior/Family from pence via Money helper; "Runs to 31 December" on every tier; mt-auto CTA row |
| FaqAccordion | shadcn Accordion + layout from https://21st.dev/@brijr/components/accordion-1 (live search "faq accordion two column section") | brijr / shadcn | MIT | 4/4/4/4/5 = 21 | Two-column ≥lg (title left, single-open accordion right), 44px triggers, 68ch answers |
| CommitteeGrid | https://21st.dev/@shadcnui-blocks/components/members-03 (live search "team section grid avatar name role"; rejected: Team Section — social icons + animation; 8bit — style; table variant — wrong shape) | shadcnui-blocks | MIT | 4/4/4/4/5 = 21 | Initials-fallback avatars, vacant-role variant linking role descriptions, role-alias mailto only, FullGrid balancing |
| StatCard | https://21st.dev/@nayan_radadiya6/components/kpi-card (live search "simple stat card label value delta kpi"; rejected: Progress Metric — Recharts sparkline; skeleton-only variant) | nayan_radadiya6 | MIT | 4/4/4/4/5 = 21 | No sparkline; tabular-nums; hint is word+colour never colour alone |
| AdminSidebar + BottomTabBar | https://21st.dev/@felipemenezes098/components/collapsible-05 (live search "collapsible sidebar with nav groups dashboard"; rejected: full dashboard block — too much; animated sidebar — gimmick) | felipemenezes098 | MIT | 4/4/4/3/5 = 20 | 240px deep rail ≥1024px, grouped collapsibles (aria-expanded), aria-current active river fill; separate 56px safe-area bottom tab bar (≤5 items) |
| EmptyState | https://21st.dev/@shadcnui-blocks/components/empty-state-01 (live search "empty state icon title description action"; rejected: marquee variant — gimmick; offline variant — too specific) | shadcnui-blocks | MIT | 4/4/5/4/5 = 22 | min-height = one card row (§3.4 sections never collapse); icon + one sentence + one action |
| Stepper | https://21st.dev/@originui/components/stepper (live search "horizontal stepper with progress steps"; rejected: percentage progress bar — not step markers; vertical default) | originui | MIT | 4/4/4/4/5 = 21 | 3-step flow, aria-current="step", done=success check, mobile condenses to numbered markers |
| Timeline | https://21st.dev/@Codehagen/components/timeline (live search "vertical timeline simple"; rejected: Modern Timeline + ruixen — scroll/entrance animation) | Codehagen | MIT | 4/4/4/4/5 = 21 | Static (no scroll animation per §3.6), river node markers, 68ch descriptions |
