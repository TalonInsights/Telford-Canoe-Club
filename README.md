# Telford Canoe Club — Website

Static site, no build step. Vercel serves the repo root as-is.

## Current state

A holding page (`index.html`) is live while the real site is built. `robots.txt`
blocks indexing and the page carries `noindex` — both need flipping at launch.

## Stack

| Piece    | Choice                                      |
| -------- | ------------------------------------------- |
| Hosting  | Vercel (`talon-insights` team)              |
| Repo     | `TalonInsights/Telford-Canoe-Club`, `main`  |
| Build    | None — static files from the repo root      |
| Framework preset | Other                               |

Every push to `main` deploys to production. Pull requests get preview URLs.

## Local preview

```bash
python -m http.server 3030
```

Then open <http://localhost:3030>.

## Launch checklist

- [ ] Replace the holding page with the real site
- [ ] Remove `<meta name="robots" content="noindex, nofollow">` from `index.html`
- [ ] Open `robots.txt` up to crawlers and add the `Sitemap:` line
- [ ] Add `sitemap.xml` (a header rule for it is already in `vercel.json`)
- [ ] Add page rewrites to `vercel.json` if the site becomes multi-route
- [ ] Point the club's domain at the Vercel project
