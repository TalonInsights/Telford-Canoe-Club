# Phase 0 migration plan — scaffold, tokens, component sourcing, shell

Written before any code, per §0 rule 1. Executed top to bottom.

## Decisions taken this phase (authorised by Talon 31 Aug: "overrule spec with substantial evidence")

| Decision | Spec said | We do | Evidence |
|---|---|---|---|
| Framework version | Next.js 15 | **Next.js 16 (latest)** | Starting a new build one major behind guarantees a mid-contract upgrade; validation confirmed 16.3.3 current and the dependency set is 16-compatible |
| `--tcc-signal-soft` | `#FBE8E4` | **`#FCEEEB`** | Measured 4.43:1 (AA fail) vs 4.64:1 (pass) — SPEC-VALIDATION §1.5 |
| Split 7/5 text measure | claims ≈660px ≈ 68ch | inner `max-width: 68ch` on text cell | 7 cols measure 690px; 68ch ≈ 560–600px — SPEC-VALIDATION §6 |
| Supabase cloud project (P0-26) | create now | code + env scaffolding now; cloud project when account decided | Club-owned-accounts intent (P13-01) + billing owner not yet decided; nothing in Phase 0 needs a live database |

## File order

1. `docs/plans/phase-00.md` (this file), `STATUS.md` — all task IDs pre-listed.
2. **P0-01** scaffold: `create-next-app` (TS strict, Tailwind v4, ESLint, App Router, pnpm) merged into repo root; holding page removed; `vercel.json` reduced to framework hint; Prettier; `CLAUDE.md`; `.env.example` (§2.2); `docs/design-decisions.md` (§3 with corrections); `.claude/launch.json` → `pnpm dev` on 3030; temporary `robots` Disallow while WIP.
3. **P0-02** `npx shadcn init` (Tailwind v4, neutral, CSS vars); 21st MCP already connected (live search verified in SPEC-VALIDATION §4); `docs/components.md` table header.
4. **P0-03** `next/font` Bricolage Grotesque + Figtree; §3.2 tokens (corrected) + §3.4 spacing in `globals.css` `@theme`; `scripts/contrast.ts` asserting every pair.
5. **P0-04** shadcn primitives in one pass, then tokenise one file at a time in spec order; `/dev/ui`.
6. **P0-05** `Container`, `Section`, `PageHero`, `FullGrid`, `Split75`, `CentredColumn`, `useBalancedColumns`; `/dev/layout`.
7. **P0-06..P0-23** blocks per §3.6 protocol: live `21st search` per block, shortlist, score, adapt onto shadcn primitives, log in `docs/components.md`, add states, show on `/dev/ui`.
8. **P0-24** `DateTime`/`Money` helpers + vitest unit tests.
9. **P0-25** root `not-found.tsx`, `error.tsx`, `loading.tsx`.
10. **P0-26** `lib/supabase/{client,server,admin,middleware}.ts` against `.env.example` names; cloud project + `pnpm supabase:types` marked BLOCKED (account ownership decision) — does not block any other Phase 0 task.
11. **P0-27** Vercel already linked and deploying `main` (done in pre-spec setup); switch framework to Next.js; verify deploy renders.
12. Phase exit: typecheck, lint, build, axe on `/dev/ui`, balance audit on `/dev/layout` at 375/768/1280, Lighthouse attempt; tick in `STATUS.md`; push.

Commit per task: `P0-NN: <what>`.
