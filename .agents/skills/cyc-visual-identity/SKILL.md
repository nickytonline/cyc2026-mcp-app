---
name: cyc-visual-identity
description: >-
  Applies the Commit Your Code 2026 visual language to MCP app widgets.
  Use when creating, editing, or restyling widgets, CSS, Tailwind tokens,
  speaker cards, schedule UI, track chips, or any CYC-branded surface.
---

# CYC26 visual identity

Match [commityourcode.com](https://www.commityourcode.com/). Do not invent a theme.

Source of truth for tokens: `widgets/src/index.css` (`--cyc-*`).

## Tokens

Use these names, never raw Inter/zinc/purple-gradient defaults:

- Navy paper: `--cyc-navy` `#031227`, `--cyc-navy-soft` `#0a2345`
- Ink: `--cyc-ink` `#07152e`
- Accent: `--cyc-blue` `#0868f7`, `--cyc-blue-dark` `#0056d8`
- Cloud / rules: `--cyc-cloud` `#f5f8fc`, `--cyc-line` `#dce5f0`
- Muted: `--cyc-muted` `#5f6e83`
- Green: `--cyc-green` `#079455`
- Radius: `--cyc-radius` `8px`
- Contained widget pane: `--cyc-widget-max` `32rem` (host `maxHeight` wins when set; never `100dvh` as iframe height)

Room colors (agenda dots):

- 1D `#ec4899` · 2A `#0868f7` · 2B `#079455` · 2C `#f97316` · 2D `#ef4444` · 2E `#7c3aed`

## Type

- Display and body: Geist Sans (`font-sans`)
- Kickers, indexes, times, room labels: Geist Mono (`font-mono`)
- Section kicker pattern: `01 / LABEL` — small, tracked, uppercase, then a heavy Geist heading
- Headings are roman (not italic)

## Patterns that belong

- Hairline rules in `--cyc-line`
- Track pills with a 4px color dot
- Navy chrome for hero/header strips; white/`--cyc-cloud` for body
- Blue CTA (`--cyc-blue`) for primary actions, 8px radius
- Dark host theme maps to navy paper, not generic `#171717`

## Bans

- Inter, Roboto, or generic SaaS card stacks
- Purple radial gradients, glassmorphism, fake browser chrome
- Restyling `primary` back to near-black / zinc-900
- Live-fetching the conference site from a widget
- Invented metrics or fake speaker photos (use catalog URLs or initials on navy)

## Photos

Speaker images are on `https://images.ctfassets.net`. Widget CSP must include that origin in `resourceDomains`. If a photo fails, show initials on `--cyc-navy`.
