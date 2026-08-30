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
