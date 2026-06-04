# GEO + SEO Audit — HATTATSU GROUP

**URL:** https://mupamuc.github.io/hattatsu-site/
**Date:** 2026-06-04
**Business type:** Agency / Professional Service (Lean consulting + training + digitalization)
**Composite GEO Score:** **33 / 100** — *Early / Weak* (new single-page static landing, no structured data, no AI-crawler files)

---

## Score Breakdown

| Category | Weight | Score | Notes |
|---|---|---|---|
| AI Citability & Visibility | 25% | 40 | Text is server-rendered (good), but no Q&A/FAQ blocks, key stats JS-only, anonymous proof |
| Brand Authority Signals | 20% | 20 | No backlinks, no real client names/logos, no `sameAs`, Telegram link is a placeholder |
| Content Quality & E-E-A-T | 20% | 35 | No author/credentials, no dated case studies, claims unsubstantiated |
| Technical Foundations | 15% | 62 | Fast static SSR, mobile ✓, HTTPS ✓ — but no canonical/sitemap/robots, render-blocking fonts |
| Structured Data | 10% | 5 | **Zero JSON-LD.** No Organization/ProfessionalService/FAQ |
| Platform Optimization | 10% | 25 | OG/Twitter cards ✓; no llms.txt, no schema for Google AI Overviews |

**Weighted total ≈ 33.3 / 100**

---

## What's Already Good ✓

- **Static server-rendered HTML** — text is in the source, not hidden behind a JS framework. AI text crawlers (GPTBot, ClaudeBot, PerplexityBot) can read body copy.
- **Title + meta description** — present, keyword-relevant (`Lean`, `производственные системы`, `цифровизация`).
- **Open Graph + Twitter card** — full set, `og:image` 1200×630 exists (200 OK, 57 KB). Good social/chat link previews.
- **Single clean H1**, logical H2 section structure.
- `lang="ru"`, `theme-color`, responsive viewport, favicon.
- Lazy-loaded simulator iframe (doesn't block page load).

---

## Critical Gaps (ranked by GEO impact)

### 1. No structured data (JSON-LD) — biggest lever
AI engines and Google AI Overviews lean on schema to *understand and trust* an entity. You have none.
**Add:** `Organization` + `ProfessionalService` (with `areaServed`, `serviceType`), `WebSite`, `FAQPage`, `BreadcrumbList`.
Impact: Structured Data 5→85, lifts Citability + Platform scores too.

### 2. No `llms.txt`, no `sitemap.xml`, no `robots.txt`
- `llms.txt` (404) — the emerging standard that tells ChatGPT/Perplexity/Claude what your site is and which pages matter.
- `sitemap.xml` (404) — no crawl map.
- `robots.txt` (404 at domain root) — no AI-crawler allow-list, no sitemap pointer.

> ⚠️ **GitHub Pages limitation (important):** This is a *project* page served at `/hattatsu-site/`. Crawlers only read `robots.txt`, `sitemap.xml`, and `/llms.txt` from the **domain root** (`mupamuc.github.io/...`), which you don't control from this repo. To get full benefit you need either (a) a **custom domain** (e.g. `hattatsu.pro`), or (b) host at the user-pages root repo `mupamuc.github.io`. A custom domain is the recommended path for a client-facing brand anyway.

### 3. Key stats invisible to non-JS crawlers
`index.html` ships counters as `<strong data-count="120">0</strong>` — raw HTML shows **0**; JS animates to the real number. Numbers are the *most citable* content type. Fix: put the real value in the HTML, let JS animate over it.

### 4. Render depends on JS (`.reveal { opacity: 0 }`)
`styles.css:318` hides every content block until JS adds `.is-in`. Text stays in the DOM (text extraction OK), but if JS fails, humans see a blank page. Add a `<noscript>` override so content is visible without JS.

### 5. Thin E-E-A-T / proof
- Testimonials are anonymous ("Директор по производству, Стекольный завод") — low trust signal.
- No author, no real case studies with dated, measurable outcomes.
- Telegram links point to bare `https://t.me/` (broken). MAX link is `#`.
- No NAP (name/address/phone), no real legal entity → weak for local/B2B trust.

### 6. No citable answer content
No FAQ, no definitions ("Что такое Lean Production?"), no methodology pages. AI answers cite pages that *directly answer questions*. A one-screen brochure gives them little to quote.

---

## Action Plan (prioritized)

### Quick wins — apply now (static-file edits, safe, additive)
1. **Inject JSON-LD** — Organization + ProfessionalService + WebSite + FAQPage + BreadcrumbList.
2. **Add `llms.txt`** (+ `sitemap.xml`) in repo — partial benefit now, full benefit after custom domain.
3. **Citable stats in HTML** — hardcode `120+`, `15`, `8`, `30%` as text content.
4. **`<noscript>` reveal fallback** + `<link rel="canonical">`.
5. **Add an FAQ section** (4–6 Q&A) wired to `FAQPage` schema — direct citability + Google AIO eligibility.
6. **Fix Telegram/MAX/email links** to real handles.

### Strategic — needs your input / assets
7. **Custom domain `hattatsu.pro`** → unlocks root `robots.txt` / `sitemap.xml` / `llms.txt`, real brand authority. (You already use `info@hattatsu.pro`, so the domain likely exists.)
8. **Real proof** — named clients/logos (with permission), 1–2 dated case studies with before/after numbers.
9. **Author/expertise page** — founder bio, credentials, years, certifications → E-E-A-T.
10. **Off-site mentions** — for AI, brand *mentions* correlate ~3× stronger than backlinks: get listed/written-up on industry sites, LinkedIn, VC.ru/Habr articles.

---

## Projected score after quick wins (1–5): ~**58–63 / 100**
## After strategic (custom domain + proof + FAQ depth): ~**78–85 / 100**
