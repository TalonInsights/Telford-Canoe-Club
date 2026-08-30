# Telford Canoe Club — Website

Next.js 16 (App Router, TypeScript strict) + Tailwind v4 + Supabase + PayPal +
Resend. Built to `docs/TCC-BUILD-SPEC-v2.0.md`; progress in `STATUS.md`;
working rules in `CLAUDE.md`.

## Stack

| Piece | Choice |
|---|---|
| Hosting | Vercel (`talon-insights` team → transfers to the club at P13-01) |
| Repo | `TalonInsights/Telford-Canoe-Club`, `main` auto-deploys |
| Framework | Next.js 16, App Router, server components by default |
| Styling | Tailwind CSS v4 mapped to `--tcc-*` tokens |
| Backend | Supabase (Postgres, Auth, Storage) — pending account decision, see STATUS.md |
| Payments | PayPal Checkout (Orders v2) + webhooks |
| Email | Resend |

## Local dev

```bash
pnpm install
pnpm dev
```

Serves on <http://localhost:3030>. Also: `pnpm typecheck`, `pnpm lint`,
`pnpm build`, `pnpm test`, `pnpm contrast`.

Environment: copy `.env.example` → `.env.local` and fill in. Secrets never
reach git or the client bundle; `SUPABASE_SERVICE_ROLE_KEY` and
`PAYPAL_CLIENT_SECRET` are server-only.
