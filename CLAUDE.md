# Telford Canoe Club — working rules for Claude Code

The build follows `docs/TCC-BUILD-SPEC-v2.0.md` (read §0 first) with the
corrections and decisions recorded in `docs/SPEC-VALIDATION.md` and
`STATUS.md`. Track every task in `STATUS.md`; plan each phase in
`docs/plans/phase-XX.md` before code.

## Operating rules (§0, restated)
1. Migration plan first, then execute top to bottom.
2. One element at a time — complete (types, loading, empty, error, mobile) before the next.
3. Tick a task in `STATUS.md` only when its acceptance line is true; blocked → `BLOCKED: reason`, move on within the phase.
4. Don't touch other phases' files; log cross-phase defects in `STATUS.md`.
5. No placeholder tokens (`TODO`, lorem, `#000`, `example.com`) in shipped code.
6. `pnpm typecheck && pnpm lint` per task; `pnpm build` per phase.
7. Mobile first: 375 → 768 → 1280.
8. Commit per task (`P2-04: event card component`); push at phase end.
9. Ambiguous → question in `STATUS.md`, take the conservative reading.
10. RLS on from table creation; service-role key server-only; every action: Zod + role check.
11. Components sourced (shadcn/ui primitives, 21st.dev blocks) via live search only; log in `docs/components.md`.
12. §3.4 balance audit + §3.5 UX rules at 375/1280 before ticking a page.

## Commands
`pnpm dev` (port 3030) · `pnpm typecheck` · `pnpm lint` · `pnpm build` ·
`pnpm test` · `pnpm supabase:migrate` · `pnpm supabase:types` ·
21st.dev search via the connected 21st MCP.

## Hard rules
- Never edit generated `types/database.ts` by hand.
- Design tokens only — no raw hex in components (`--tcc-*` in `app/globals.css`).
- Sentence case everywhere. Icons: `lucide-react` only.
- `--tcc-signal-soft` is `#FCEEEB` (AA-corrected), not the spec's `#FBE8E4`.
- Venue river gauge links Buildwas station 2134 (Severn), never the EA "Ironbridge" station (that's the Dee).
