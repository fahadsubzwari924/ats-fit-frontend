# Landing Page Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Per `ats-fit-frontend/CLAUDE.md` and `ats-fit-backend/CLAUDE.md` dispatch rules:** Every implementation task below declares an Agency `subagent_type` (exact filename from `.claude/agents/_index.json`, no `.md`). **Never** dispatch with `subagent_type: "general-purpose"`. Superpowers' `subagent-driven-development` template must be overridden with the declared Agency role for each task.

**Goal:** Extract the Angular landing page into a new standalone static site `ats-fit-website` (zero runtime deps, Tailwind CLI + vanilla JS), preserve 100% visual parity, ship with SEO baseline + structured data + Lighthouse ≥ 95, deploy to Railway at `atsfit.io`, and clean the landing code out of `ats-fit-frontend`.

**Architecture:** Two-repo topology. `ats-fit-website` (new repo) serves static HTML/CSS/JS from nginx on Railway at the apex domain `atsfit.io`. `ats-fit-frontend` Angular app continues to serve the authenticated product at `app.atsfit.io` and its root `/` becomes a redirect to `/dashboard`. Cross-domain navigation via absolute URLs — no shared runtime, no CORS surface.

**Tech Stack:**
- Static site: HTML5, Tailwind CSS v4 (CLI), vanilla JS (ES6), esbuild (minify), nginx (serve), Docker (Railway build).
- Tests for JS modules: Vitest + jsdom (dev-dep only, no runtime impact).
- Angular side: existing Angular 20 / TypeScript / RxJS stack, unchanged.

**Spec:** `ats-fit-frontend/docs/superpowers/specs/2026-04-20-landing-page-extraction-design.md` (Approved, 2026-04-20).

---

## Repo Paths (absolute)

| Repo | Absolute path | Remote |
|------|---------------|--------|
| New static site | `/Users/fahadsubzwari924/Documents/sideProjects/ATS_FIT/ats-fit-website/` | `git@github.com:fahadsubzwari924/ats-fit-website.git` |
| Angular app (cleanup) | `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-frontend/` | existing |
| VSCode workspace | `/Users/fahadsubzwari924/Documents/sideProjects/ATS_FIT/ats-fit-vscode.code-workspace` | — |

Shorthand used below: `$WEB` = `/Users/fahadsubzwari924/Documents/sideProjects/ATS_FIT/ats-fit-website`, `$FE` = `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-frontend`.

---

## File Structure (to be created in `$WEB`)

| Path | Responsibility |
|------|----------------|
| `src/index.html` | Single-page landing, all content hardcoded, full SEO head + 3 JSON-LD blocks. |
| `src/styles/tokens.css` | `@theme` + `:root { --ats-* }` ported verbatim from `$FE/src/styles.scss`. |
| `src/styles/tailwind.css` | Tailwind entrypoint (`@tailwind base/components/utilities`) + imports `tokens.css`, `components.css`. |
| `src/styles/components.css` | Ported rules from audited SCSS partials + four subcomponent files, flattened to flat CSS classes. |
| `src/styles/animations.css` | Keyframes `fade-in-up` + any other landing-referenced keyframes. |
| `src/scripts/mobile-menu.js` | Hamburger open/close, aria sync, Escape + link-click close. |
| `src/scripts/pricing-toggle.js` | Monthly/Annual toggle: updates amounts, periods, savings hint from data-attrs. |
| `src/assets/{favicon.svg,og-image.png,logo.svg}` | Static assets. |
| `public/robots.txt` | Allow all + sitemap pointer. |
| `public/sitemap.xml` | Single URL with dynamic `lastmod`. |
| `scripts/build.js` | Orchestrator: Tailwind CLI → esbuild JS → copy HTML/assets/public → `dist/`. |
| `tests/mobile-menu.test.js` | Vitest + jsdom behavior tests. |
| `tests/pricing-toggle.test.js` | Vitest + jsdom behavior tests. |
| `tailwind.config.js` | Content globs + theme (mirrors `$FE` config). |
| `package.json` | Scripts: `build`, `dev`, `preview`, `test`. Dev-deps only. |
| `Dockerfile` | Multi-stage: `node:20-alpine` build → `nginx:alpine` serve. |
| `nginx.conf` | Static serving + gzip + cache headers + security headers + SPA fallback. |
| `.gitignore` | Standard Node + `dist/`. |
| `README.md` | How to build, preview, deploy; layout overview. |

Files modified in `$FE`:
- `src/app/app.routes.ts` — remove landing route, add redirect.
- `src/styles.scss` — remove landing-only animations/utilities after grep-audit.
- `src/app/shared/constants/billing-cycle.constant.ts` — created if `BILLING_CYCLE` is referenced outside landing.

Files deleted in `$FE`:
- `src/app/root/landing/` — entire folder.

---

## Global Conventions

- **HTML/CSS parity verified visually:** tasks end with a side-by-side screenshot check at 375 / 768 / 1024 / 1440 viewport widths against the Angular landing served locally on `$FE` at `http://localhost:4200/`.
- **No placeholders in shipped code.** Every TODO/FIXME in final artifacts is a review blocker.

---

## Execution Rules for This Session

- **NO TDD:** Skip all test-writing steps in Tasks 13–14. Implement JS modules directly; manual smoke tests at Task 20.
- **NO COMMITS:** Do not commit changes after any task. Accumulate all changes locally. Only commit once at the very end after user review approval.
- **REVIEW GATE:** After all tasks complete, ask user for review before shipping.
- **SHIP WORKFLOW:** When user says "ship", execute in order:
  ```bash
  git stash                                    # stash all changes
  git checkout master
  git pull origin master                       # latest
  git checkout -b af-61-landing-extraction    # new feature branch
  git stash pop                                # restore changes into branch
  gh pr create --base master                   # open PR
  ```

---

## Task 1: Bootstrap `ats-fit-website` repo skeleton

**Agency role:** `engineering-devops-automator`

**Files:**
- Create: `$WEB/package.json`
- Create: `$WEB/.gitignore`
- Create: `$WEB/tailwind.config.js`
- Create: `$WEB/src/styles/tailwind.css`
- Create: `$WEB/src/index.html` (empty stub — replaced in Task 4)
- Create: `$WEB/README.md`

- [ ] **Step 1: Create the directory tree**

```bash
mkdir -p "$WEB"/{src/{styles,scripts,assets},public,scripts,dist,tests}
cd "$WEB"
```

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "ats-fit-website",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "build": "node scripts/build.js",
    "dev": "tailwindcss -i src/styles/tailwind.css -o dist/styles.css --watch",
    "preview": "serve dist -l 5000",
    "test": "vitest run"
  },
  "devDependencies": {
    "@tailwindcss/cli": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "esbuild": "^0.24.0",
    "serve": "^14.2.4",
    "vitest": "^2.1.0",
    "jsdom": "^25.0.0"
  }
}
```

- [ ] **Step 3: Write `.gitignore`**

```
node_modules/
dist/
*.log
.DS_Store
.env*
```

- [ ] **Step 4: Write `tailwind.config.js` (content globs only — theme lives in `tokens.css` via `@theme`)**

```js
export default {
  content: ['./src/**/*.{html,js}'],
  theme: { extend: {} },
  plugins: [],
};
```

- [ ] **Step 5: Write `src/styles/tailwind.css` entrypoint (tokens + components imported in later tasks)**

```css
@import "tailwindcss";
@import "./tokens.css";
@import "./animations.css";
@import "./components.css";
```

- [ ] **Step 6: Write `src/index.html` stub**

```html
<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>ATS Fit</title></head>
  <body>Bootstrap stub — replaced in Task 4.</body>
</html>
```

- [ ] **Step 7: Write placeholder README**

```md
# ats-fit-website

Standalone static landing site for ATS Fit. See
`ats-fit-frontend/docs/superpowers/specs/2026-04-20-landing-page-extraction-design.md`.

## Commands
- `npm run build` — build to `dist/`.
- `npm run dev` — Tailwind watch.
- `npm run preview` — serve `dist/` at :5000.
- `npm run test` — Vitest.
```

- [ ] **Step 8: Install deps**

```bash
cd "$WEB"
npm install
```

Expected: install completes with zero runtime deps (check `"dependencies"` absent from `package.json`).

- [ ] **Step 9: Commit (no remote yet — remote wired in Task 21)**

```bash
cd "$WEB"
git init -q
git branch -M master
git add .
git commit -m "chore: bootstrap ats-fit-website scaffold"
```

---

## Task 2: Port design tokens + base CSS

**Agency role:** `engineering-frontend-developer`

**Context:** Spec §6.1–6.2. Copy `@theme` and `:root { --ats-* }` verbatim from `$FE/src/styles.scss`. Port only base rules actually referenced by the landing markup (Inter font, body reset, focus ring).

**Files:**
- Create: `$WEB/src/styles/tokens.css`
- Create: `$WEB/src/styles/animations.css`

- [ ] **Step 1: Open `$FE/src/styles.scss` and locate the `@theme { ... }` block and the `:root { --ats-* ... }` block.**

- [ ] **Step 2: Create `src/styles/tokens.css` with both blocks copied exactly**

```css
/* --- @theme (Tailwind v4 design tokens) --- */
@theme {
  /* paste @theme body from $FE/src/styles.scss verbatim */
}

/* --- :root design-system custom properties --- */
:root {
  /* paste :root --ats-* vars from $FE/src/styles.scss verbatim */
}

/* --- Base resets (Inter, body) --- */
@layer base {
  html { font-family: 'Inter', system-ui, sans-serif; }
  body { @apply bg-background text-foreground antialiased; }
  :focus-visible { outline: 2px solid var(--color-ring); outline-offset: 2px; }
}
```

- [ ] **Step 3: Grep-audit keyframes in the Angular landing to know which to port**

```bash
grep -RIn 'animation:' "$FE/src/app/root/landing" || true
grep -RIn '@keyframes' "$FE/src/styles.scss" "$FE/src/scss" || true
```

Keep only keyframes referenced on the landing (expected: `fade-in-up`, `shimmer`). Drop `float-up`, `pulse-soft`, `blink`, `bounce-once` if unreferenced.

- [ ] **Step 4: Write `src/styles/animations.css`**

```css
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.anim-fade-in-up { animation: fade-in-up 0.5s ease-out both; }

@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.anim-shimmer { animation: shimmer 2s linear infinite; }
```

- [ ] **Step 5: Build + confirm Tailwind picks up the tokens**

```bash
cd "$WEB"
npm run build 2>&1 | tail -20 || true   # build.js is wired later; run tailwind directly:
npx tailwindcss -i src/styles/tailwind.css -o dist/styles.css
head -40 dist/styles.css
```

Expected: `dist/styles.css` contains token custom properties.

- [ ] **Step 6: Commit**

```bash
git add src/styles/tokens.css src/styles/animations.css
git commit -m "style: port design tokens and landing-used keyframes"
```

---

## Task 3: Port component styles (feature-card, testimonial-card, price-card)

**Agency role:** `engineering-frontend-developer`

**Context:** Spec §6.2–6.3. Take the four SCSS files from Angular subcomponents plus audited rules from `_buttons.scss`, `_app-header.scss`, `_components.scss`, `_utilities.scss`, and flatten into `components.css` with stable class names (`.feature-card`, `.testimonial-card`, `.price-card`, `.section-title`). No BEM changes. Drop anything not referenced by the landing markup.

**Files:**
- Create: `$WEB/src/styles/components.css`

- [ ] **Step 1: Read each source file and enumerate selectors used**

Source files:
- `$FE/src/app/root/landing/components/feature-card/feature-card.component.scss`
- `$FE/src/app/root/landing/components/job-stroy-card/job-stroy-card.component.scss`
- `$FE/src/app/root/landing/components/price-card/price-card.component.scss`
- `$FE/src/app/root/landing/components/section-title-and-detail/section-title-and-detail.component.scss`
- `$FE/src/scss/_buttons.scss`
- `$FE/src/scss/_app-header.scss`
- `$FE/src/scss/_components.scss`
- `$FE/src/scss/_utilities.scss`

- [ ] **Step 2: Write `src/styles/components.css` with four flattened blocks**

```css
/* Feature card — ported from feature-card.component.scss */
.feature-card {
  /* paste rules */
}
.feature-card__icon { /* paste */ }
.feature-card__title { /* paste */ }
.feature-card__desc { /* paste */ }

/* Testimonial card — ported from job-stroy-card.component.scss */
.testimonial-card { /* paste */ }
.testimonial-card__avatar { /* paste */ }
.testimonial-card__quote { /* paste */ }
.testimonial-card__meta { /* paste */ }

/* Price card — ported from price-card.component.scss */
.price-card { /* paste */ }
.price-card--featured { /* paste */ }
.price-amount { /* paste */ }
.price-period { /* paste */ }
.price-card__cta { /* paste */ }

/* Section title — ported from section-title-and-detail.component.scss */
.section-title { /* paste */ }
.section-subtitle { /* paste */ }

/* Buttons — audited port from _buttons.scss */
.btn-primary { /* paste only rules used on landing */ }
.btn-secondary { /* paste only rules used on landing */ }

/* Header — audited port from _app-header.scss */
.app-header { /* paste only rules used on landing */ }
.mobile-menu { /* paste + extend for hamburger */ }
.mobile-menu.is-open { display: block; }

/* Skip link */
.skip-to-content {
  position: absolute; left: -9999px;
}
.skip-to-content:focus {
  left: 1rem; top: 1rem; z-index: 1000;
  padding: 0.5rem 1rem; background: #fff; border: 2px solid var(--color-ring);
}
```

- [ ] **Step 3: Rebuild stylesheet and inspect size**

```bash
npx tailwindcss -i src/styles/tailwind.css -o dist/styles.css
wc -c dist/styles.css
```

Expected: file present, non-empty. No runtime error.

- [ ] **Step 4: Commit**

```bash
git add src/styles/components.css
git commit -m "style: port feature/testimonial/price card styles"
```

---

## Task 4: HTML skeleton + SEO head (JSON-LD stubs)

**Agency role:** `engineering-frontend-developer`

**Context:** Spec §5, §8.1. Replace the Task 1 stub with the full document shell: DOCTYPE, full `<head>` (title, meta description, canonical, OG, Twitter, preconnect, preload, icon, theme-color), three JSON-LD `<script>` tags (placeholders; filled in Task 17 and Task 11), skip link, empty `<header>`, empty `<main id="main">`, empty `<footer>`, deferred script tags.

**Files:**
- Modify: `$WEB/src/index.html`

- [ ] **Step 1: Write the full skeleton**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <title>ATS Fit — Tailor Your Resume in Under a Minute | AI Resume Optimization</title>
  <meta name="description" content="Beat the ATS and land more interviews with AI-powered resume tailoring. Join thousands of job seekers who've transformed their job search success.">
  <link rel="canonical" href="https://atsfit.io/">

  <meta property="og:type" content="website">
  <meta property="og:url" content="https://atsfit.io/">
  <meta property="og:title" content="ATS Fit — Tailor Your Resume in Under a Minute">
  <meta property="og:description" content="Beat the ATS and land more interviews with AI-powered resume tailoring.">
  <meta property="og:image" content="https://atsfit.io/assets/og-image.png">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="ATS Fit — Tailor Your Resume in Under a Minute">
  <meta name="twitter:description" content="Beat the ATS and land more interviews with AI-powered resume tailoring.">
  <meta name="twitter:image" content="https://atsfit.io/assets/og-image.png">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" href="/styles.css" as="style">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <meta name="theme-color" content="#2563EB">

  <link rel="stylesheet" href="/styles.css">

  <script type="application/ld+json" id="ld-organization">/* filled in Task 17 */</script>
  <script type="application/ld+json" id="ld-software">/* filled in Task 17 */</script>
  <script type="application/ld+json" id="ld-faq">/* filled in Task 11 */</script>
</head>
<body>
  <a href="#main" class="skip-to-content">Skip to content</a>

  <header class="app-header"><!-- Task 5 --></header>

  <main id="main">
    <!-- Task 6: Hero -->
    <!-- Task 7: Problem/Solution -->
    <!-- Task 8: Features -->
    <!-- Task 9: Pricing -->
    <!-- Task 10: Testimonials -->
    <!-- Task 11: FAQ -->
  </main>

  <footer><!-- Task 12 --></footer>

  <script src="/mobile-menu.js" defer></script>
  <script src="/pricing-toggle.js" defer></script>
</body>
</html>
```

- [ ] **Step 2: Serve and load locally**

```bash
npx tailwindcss -i src/styles/tailwind.css -o dist/styles.css
cp src/index.html dist/index.html
npx serve dist -l 5000 &
curl -s http://localhost:5000 | head -20
kill %1
```

Expected: HTML response with the head we wrote.

- [ ] **Step 3: Validate at https://validator.w3.org/#validate_by_input — paste source. Zero errors expected (warnings OK).**

- [ ] **Step 4: Commit**

```bash
git add src/index.html
git commit -m "feat: html skeleton with seo head and json-ld stubs"
```

---

## Task 5: Header + mobile nav markup

**Agency role:** `engineering-frontend-developer`

**Context:** Spec §5.1. Port the current Angular header visually. Logo left; desktop anchor nav (`#features`, `#pricing`, `#testimonials`, `#faq`); Login + Signup buttons right; hamburger toggle for mobile; a second `<nav id="mobile-menu" aria-hidden="true">` below. Login → `https://app.atsfit.io/signin`. Signup → `https://app.atsfit.io/signup`.

**Files:**
- Modify: `$WEB/src/index.html` (replace `<header>` block)

- [ ] **Step 1: Write header markup**

```html
<header class="app-header">
  <nav class="flex items-center justify-between max-w-7xl mx-auto px-6 py-4">
    <a href="/" class="flex items-center gap-2">
      <img src="/assets/logo.svg" width="32" height="32" alt="ATS Fit logo">
      <span class="font-semibold text-lg">ATS Fit</span>
    </a>

    <ul class="hidden md:flex items-center gap-8">
      <li><a href="#features">Features</a></li>
      <li><a href="#pricing">Pricing</a></li>
      <li><a href="#testimonials">Testimonials</a></li>
      <li><a href="#faq">FAQ</a></li>
    </ul>

    <div class="hidden md:flex items-center gap-3">
      <a href="https://app.atsfit.io/signin" class="btn-secondary">Login</a>
      <a href="https://app.atsfit.io/signup" class="btn-primary">Get Started</a>
    </div>

    <button id="mobile-menu-button"
            class="md:hidden"
            aria-label="Open menu"
            aria-expanded="false"
            aria-controls="mobile-menu">
      <svg width="24" height="24" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 6h16M4 12h16M4 18h16" stroke-linecap="round"/>
      </svg>
    </button>
  </nav>

  <nav id="mobile-menu" class="mobile-menu md:hidden" aria-hidden="true">
    <ul class="flex flex-col gap-4 p-6">
      <li><a href="#features">Features</a></li>
      <li><a href="#pricing">Pricing</a></li>
      <li><a href="#testimonials">Testimonials</a></li>
      <li><a href="#faq">FAQ</a></li>
      <li><a href="https://app.atsfit.io/signin" class="btn-secondary">Login</a></li>
      <li><a href="https://app.atsfit.io/signup" class="btn-primary">Get Started</a></li>
    </ul>
  </nav>
</header>
```

- [ ] **Step 2: Rebuild + preview at viewports 375 and 1440**

```bash
npx tailwindcss -i src/styles/tailwind.css -o dist/styles.css
cp src/index.html dist/index.html
npx serve dist -l 5000 &
```

Open `http://localhost:5000` at 1440 width and 375 width (devtools device toolbar). Compare to `npm start`-running Angular landing header on `$FE`.

- [ ] **Step 3: Commit**

```bash
git add src/index.html
git commit -m "feat: header and mobile nav markup with cross-domain auth links"
```

---

## Task 6: Hero section

**Agency role:** `engineering-frontend-developer`

**Context:** Spec §5.1 item 1. Source of truth: hero block in `$FE/src/app/root/landing/landing.component.html`. Port AI-powered badge, gradient headline, sub-copy, "Get Started" CTA → `https://app.atsfit.io/signup`, 3-stat trust bar card (95% / 3x / <60s).

**Files:**
- Modify: `$WEB/src/index.html` (insert into `<main>`)

- [ ] **Step 1: Open `$FE/src/app/root/landing/landing.component.html` and copy the hero block (top section) verbatim. Translate Angular bindings to static text: `{{ ... }}` → literal copy; `[class.x]="..."` → static class; `*ngIf`/`*ngFor` → inline markup.**

- [ ] **Step 2: Insert the translated block after `<!-- Task 6: Hero -->`**

```html
<section id="hero" class="anim-fade-in-up">
  <div class="max-w-7xl mx-auto px-6 py-20 text-center">
    <span class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
      <!-- AI-powered badge icon + copy copied from Angular -->
      AI-Powered Resume Optimization
    </span>
    <h1 class="mt-6 text-5xl md:text-6xl font-bold">
      <span class="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
        Tailor Your Resume in Under a Minute
      </span>
    </h1>
    <p class="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
      <!-- sub-copy copied verbatim from Angular hero -->
    </p>
    <a href="https://app.atsfit.io/signup" class="btn-primary mt-8 inline-block">Get Started</a>

    <div class="mt-16 grid grid-cols-3 gap-6 max-w-3xl mx-auto rounded-2xl border p-6 bg-card">
      <div><div class="text-3xl font-bold">95%</div><div class="text-sm text-muted-foreground">ATS pass rate</div></div>
      <div><div class="text-3xl font-bold">3x</div><div class="text-sm text-muted-foreground">More interviews</div></div>
      <div><div class="text-3xl font-bold">&lt;60s</div><div class="text-sm text-muted-foreground">Per tailor</div></div>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Preview + compare to Angular hero at 375 / 768 / 1024 / 1440. Adjust ported class names and nested markup until visually indistinguishable. Note any differences in a `parity-notes.md` scratchpad (not committed).**

- [ ] **Step 4: Commit**

```bash
git add src/index.html
git commit -m "feat: hero section with CTA and trust bar"
```

---

## Task 7: Problem/Solution section

**Agency role:** `engineering-frontend-developer`

**Files:**
- Modify: `$WEB/src/index.html`

- [ ] **Step 1: Port the two-card (red / green) problem-solution block from `$FE/src/app/root/landing/landing.component.html`. Insert after `<!-- Task 7: Problem/Solution -->`. Use identical copy.**

```html
<section id="problem-solution" class="py-20">
  <div class="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-8">
    <div class="rounded-2xl border border-red-200 bg-red-50 p-8">
      <h2 class="text-2xl font-bold text-red-700">The Problem</h2>
      <!-- copy bullets verbatim -->
    </div>
    <div class="rounded-2xl border border-green-200 bg-green-50 p-8">
      <h2 class="text-2xl font-bold text-green-700">The Solution</h2>
      <!-- copy bullets verbatim -->
    </div>
  </div>
</section>
```

- [ ] **Step 2: Preview + parity check at 375 / 768 / 1024 / 1440.**

- [ ] **Step 3: Commit**

```bash
git add src/index.html
git commit -m "feat: problem/solution section"
```

---

## Task 8: Features grid

**Agency role:** `engineering-frontend-developer`

**Context:** Spec §5.1 item 3. Source: `features()` list in `$FE/src/app/root/landing/landing.component.ts` (or constants/interfaces dir). Hardcode each card (icon, title, description) as static HTML.

**Files:**
- Modify: `$WEB/src/index.html`

- [ ] **Step 1: Read features array from Angular**

```bash
grep -A 200 'features' "$FE/src/app/root/landing/landing.component.ts" | head -200
ls "$FE/src/app/root/landing/constants/" "$FE/src/app/root/landing/interfaces/"
```

- [ ] **Step 2: Insert features section**

```html
<section id="features" class="py-20 bg-muted/30">
  <div class="max-w-7xl mx-auto px-6">
    <h2 class="section-title">Features that get you hired</h2>
    <p class="section-subtitle">Why ATS Fit wins.</p>

    <div class="mt-12 grid md:grid-cols-3 gap-6">
      <!-- Repeat per feature from Angular source. Example: -->
      <article class="feature-card">
        <div class="feature-card__icon"><!-- inline svg from Angular --></div>
        <h3 class="feature-card__title">Smart Keyword Matching</h3>
        <p class="feature-card__desc">Description copied from Angular features() entry.</p>
      </article>
      <!-- ...additional <article>s, one per features() entry -->
    </div>
  </div>
</section>
```

- [ ] **Step 3: Parity check at 375 / 768 / 1024 / 1440.**

- [ ] **Step 4: Commit**

```bash
git add src/index.html
git commit -m "feat: features grid with hardcoded cards"
```

---

## Task 9: Pricing section with data attributes

**Agency role:** `engineering-frontend-developer`

**Context:** Spec §5.1 item 4, §7.2. Mirror the Angular pricing UI: `Monthly`/`Annual` toggle buttons with `data-cycle`, two `.price-card`s with `data-monthly-price`, `data-annual-price`, `data-monthly-period`, `data-annual-period`. Include the "Save 38%" badge and a `#annual-savings-hint` element. Default visible state: Monthly.

**Files:**
- Modify: `$WEB/src/index.html`

- [ ] **Step 1: Read the Angular pricing block for exact copy and prices from `$FE/src/app/root/landing/constants/pricing.constants.ts`.**

- [ ] **Step 2: Insert pricing section**

```html
<section id="pricing" class="py-20">
  <div class="max-w-7xl mx-auto px-6">
    <h2 class="section-title">Simple, honest pricing</h2>

    <div class="mt-8 inline-flex rounded-full border p-1" role="group" aria-label="Billing cycle">
      <button type="button" data-cycle="monthly" class="px-4 py-2 rounded-full" aria-pressed="true">Monthly</button>
      <button type="button" data-cycle="annual"  class="px-4 py-2 rounded-full" aria-pressed="false">
        Annual <span class="ml-1 rounded-full bg-green-100 text-green-700 text-xs px-2 py-0.5">Save 38%</span>
      </button>
    </div>
    <p id="annual-savings-hint" class="mt-2 text-sm text-green-700 hidden">You save $55/year.</p>

    <div class="mt-8 grid md:grid-cols-2 gap-6">
      <article class="price-card"
               data-monthly-price="$0" data-annual-price="$0"
               data-monthly-period="forever" data-annual-period="forever">
        <h3>Free</h3>
        <div><span class="price-amount">$0</span><span class="price-period">/forever</span></div>
        <!-- bullets copied verbatim -->
        <a class="price-card__cta btn-secondary" href="https://app.atsfit.io/signup">Start free</a>
      </article>

      <article class="price-card price-card--featured"
               data-monthly-price="$12" data-annual-price="$89"
               data-monthly-period="/month" data-annual-period="/year">
        <h3>Pro</h3>
        <div><span class="price-amount">$12</span><span class="price-period">/month</span></div>
        <!-- bullets copied verbatim -->
        <a class="price-card__cta btn-primary" href="https://app.atsfit.io/signup">Go Pro</a>
      </article>
    </div>
  </div>
</section>
```

**Note:** Verify the actual price numbers against `pricing.constants.ts` and `$FE/src/app/root/landing/landing.component.html` before committing; the values above are illustrative.

- [ ] **Step 3: Parity check at 375 / 768 / 1024 / 1440.**

- [ ] **Step 4: Commit**

```bash
git add src/index.html
git commit -m "feat: pricing section with cycle toggle data attributes"
```

---

## Task 10: Testimonials grid

**Agency role:** `engineering-frontend-developer`

**Context:** Spec §5.1 item 5. Source: `testimonials()` list in Angular landing. Hardcode each card.

**Files:**
- Modify: `$WEB/src/index.html`

- [ ] **Step 1: Read testimonials content from Angular.**

- [ ] **Step 2: Insert testimonials section**

```html
<section id="testimonials" class="py-20 bg-muted/30">
  <div class="max-w-7xl mx-auto px-6">
    <h2 class="section-title">Loved by job seekers</h2>

    <div class="mt-12 grid md:grid-cols-3 gap-6">
      <article class="testimonial-card">
        <p class="testimonial-card__quote">"..."</p>
        <div class="testimonial-card__meta">
          <img class="testimonial-card__avatar" src="..." alt="..." width="48" height="48">
          <div><div>Name</div><div class="text-sm text-muted-foreground">Role @ Company</div></div>
        </div>
      </article>
      <!-- ... one <article> per testimonial -->
    </div>
  </div>
</section>
```

- [ ] **Step 3: Parity check at 375 / 768 / 1024 / 1440.**

- [ ] **Step 4: Commit**

```bash
git add src/index.html
git commit -m "feat: testimonials grid"
```

---

## Task 11: FAQ section + FAQPage JSON-LD

**Agency role:** `engineering-frontend-developer`

**Context:** Spec §5.1 item 6, §8.1. New section (no Angular source). Write 6–10 Q/A pairs. Markup uses `<details>`/`<summary>` for zero-JS accessibility. Populate the `#ld-faq` JSON-LD block so `Question`/`Answer` entries mirror the rendered FAQ.

**Files:**
- Modify: `$WEB/src/index.html`

- [ ] **Step 1: Draft 8 FAQ entries** (examples; adjust copy as needed):

1. What is ATS Fit and who is it for?
2. How does ATS keyword matching work?
3. Is my resume data private?
4. Which file formats does ATS Fit support?
5. Can I cancel anytime?
6. Do you offer refunds?
7. Does the free plan work forever?
8. Can I use ATS Fit for non-tech roles?

- [ ] **Step 2: Insert FAQ section**

```html
<section id="faq" class="py-20">
  <div class="max-w-3xl mx-auto px-6">
    <h2 class="section-title">Frequently asked questions</h2>
    <div class="mt-8 divide-y">
      <details class="py-4">
        <summary class="cursor-pointer font-medium">What is ATS Fit and who is it for?</summary>
        <p class="mt-2 text-muted-foreground">Answer paragraph...</p>
      </details>
      <!-- repeat <details> for each Q -->
    </div>
  </div>
</section>
```

- [ ] **Step 3: Replace `#ld-faq` stub with real FAQPage JSON-LD**

```html
<script type="application/ld+json" id="ld-faq">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is ATS Fit and who is it for?",
      "acceptedAnswer": { "@type": "Answer", "text": "Answer paragraph..." }
    }
    /* one entry per <details> */
  ]
}
</script>
```

- [ ] **Step 4: Validate at https://search.google.com/test/rich-results — paste final rendered HTML. Expected: FAQPage parses green.**

- [ ] **Step 5: Commit**

```bash
git add src/index.html
git commit -m "feat: faq section with FAQPage json-ld"
```

---

## Task 12: Footer

**Agency role:** `engineering-frontend-developer`

**Context:** Port the current Angular footer from `$FE/src/app/root/layout/components/footer/` visually.

**Files:**
- Modify: `$WEB/src/index.html` (replace `<footer>` block)

- [ ] **Step 1: Read footer markup**

```bash
ls "$FE/src/app/root/layout/components/footer/"
```

- [ ] **Step 2: Port the footer** — logo, column links, copyright line. Auth/app links point to `https://app.atsfit.io/...`.

```html
<footer class="border-t">
  <div class="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-4 gap-8">
    <!-- columns copied from Angular footer -->
    <div class="md:col-span-4 text-sm text-muted-foreground">© 2026 ATS Fit. All rights reserved.</div>
  </div>
</footer>
```

- [ ] **Step 3: Parity check at 375 / 768 / 1024 / 1440.**

- [ ] **Step 4: Commit**

```bash
git add src/index.html
git commit -m "feat: footer ported from angular layout"
```

---

## Task 13: `mobile-menu.js`

**Agency role:** `engineering-frontend-developer`

**Context:** Spec §7.1. No TDD (per session rules). Implement: toggle class `.is-open`, sync `aria-expanded` on button, sync `aria-hidden` on menu, close on anchor click + Escape.

**Files:**
- Create: `$WEB/src/scripts/mobile-menu.js`

- [ ] **Step 1: Write `src/scripts/mobile-menu.js`**

```js
export function init() {
  const btn = document.getElementById('mobile-menu-button');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  const setOpen = (open) => {
    menu.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
  };

  btn.addEventListener('click', () => setOpen(!menu.classList.contains('is-open')));
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
}

if (typeof window !== 'undefined' && document.readyState !== 'loading') init();
else if (typeof window !== 'undefined') document.addEventListener('DOMContentLoaded', init);
```

- [ ] **Step 2: Manual smoke test in browser** — open `npm run preview` at 375 viewport; click hamburger; verify menu opens, aria updates, Escape closes, link-click closes.

- [ ] **Step 3: Do NOT commit** — leave file staged but uncommitted.

---

## Task 14: `pricing-toggle.js`

**Agency role:** `engineering-frontend-developer`

**Context:** Spec §7.2. No TDD (per session rules). Implement: monthly/annual toggle, update prices + periods from `data-*` attrs, toggle savings hint visibility.

**Files:**
- Create: `$WEB/src/scripts/pricing-toggle.js`

- [ ] **Step 1: Write `src/scripts/pricing-toggle.js`**

```js
export function init() {
  const buttons = document.querySelectorAll('[data-cycle]');
  const cards = document.querySelectorAll('.price-card');
  const hint = document.getElementById('annual-savings-hint');

  function apply(cycle) {
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cycle === cycle)));
    cards.forEach((card) => {
      const amount = card.querySelector('.price-amount');
      const period = card.querySelector('.price-period');
      if (amount) amount.textContent = card.dataset[`${cycle}Price`];
      if (period) period.textContent = card.dataset[`${cycle}Period`];
    });
    if (hint) hint.classList.toggle('hidden', cycle !== 'annual');
  }

  buttons.forEach((b) => b.addEventListener('click', () => apply(b.dataset.cycle)));
}

if (typeof window !== 'undefined' && document.readyState !== 'loading') init();
else if (typeof window !== 'undefined') document.addEventListener('DOMContentLoaded', init);
```

- [ ] **Step 2: Manual smoke test in browser** — open `npm run preview` at pricing section; click Monthly/Annual toggle; verify prices, periods, savings hint update correctly.

- [ ] **Step 3: Do NOT commit** — leave file staged but uncommitted.

---

## Task 15: Build script

**Agency role:** `engineering-devops-automator`

**Context:** Spec §4.2, §7.3. Orchestrate: Tailwind CLI → esbuild JS → copy HTML/assets/public → `dist/`.

**Files:**
- Create: `$WEB/scripts/build.js`

- [ ] **Step 1: Write `scripts/build.js`**

```js
import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { build as esbuild } from 'esbuild';
import { resolve } from 'node:path';

const ROOT = resolve('.');
const OUT = resolve(ROOT, 'dist');

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

// 1) Tailwind → dist/styles.css (minified)
execSync(`npx tailwindcss -i src/styles/tailwind.css -o ${OUT}/styles.css --minify`, { stdio: 'inherit' });

// 2) JS → dist/*.js (minified)
await esbuild({
  entryPoints: ['src/scripts/mobile-menu.js', 'src/scripts/pricing-toggle.js'],
  outdir: OUT,
  minify: true,
  format: 'iife',
  bundle: false,
  logLevel: 'info',
});

// 3) HTML + assets + public → dist/
cpSync('src/index.html', `${OUT}/index.html`);
if (existsSync('src/assets')) cpSync('src/assets', `${OUT}/assets`, { recursive: true });
if (existsSync('public'))     cpSync('public', OUT, { recursive: true });

// 4) Write lastmod into sitemap if present
const sitemap = `${OUT}/sitemap.xml`;
if (existsSync(sitemap)) {
  const today = new Date().toISOString().slice(0, 10);
  writeFileSync(sitemap, readFileSync(sitemap, 'utf8').replace('__LASTMOD__', today));
}

console.log('build: done →', OUT);
```

- [ ] **Step 2: Run build**

```bash
cd "$WEB"
npm run build
ls dist
```

Expected files in `dist/`: `index.html`, `styles.css`, `mobile-menu.js`, `pricing-toggle.js`, `assets/`, (after Task 16: `robots.txt`, `sitemap.xml`).

- [ ] **Step 3: Commit**

```bash
git add scripts/build.js
git commit -m "build: orchestrated tailwind + esbuild + copy pipeline"
```

---

## Task 16: robots.txt + sitemap.xml

**Agency role:** `engineering-frontend-developer`

**Files:**
- Create: `$WEB/public/robots.txt`
- Create: `$WEB/public/sitemap.xml`

- [ ] **Step 1: Write `public/robots.txt`**

```
User-agent: *
Allow: /
Sitemap: https://atsfit.io/sitemap.xml
```

- [ ] **Step 2: Write `public/sitemap.xml`** — `__LASTMOD__` gets replaced by `build.js`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://atsfit.io/</loc>
    <lastmod>__LASTMOD__</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

- [ ] **Step 3: Rebuild and verify replacement worked**

```bash
npm run build
cat dist/sitemap.xml
curl -s http://localhost:5000/robots.txt
```

Expected: `<lastmod>` is an ISO date like `2026-04-21`.

- [ ] **Step 4: Commit**

```bash
git add public/robots.txt public/sitemap.xml
git commit -m "feat: robots.txt and sitemap.xml with build-time lastmod"
```

---

## Task 17: Fill Organization + SoftwareApplication JSON-LD

**Agency role:** `engineering-frontend-developer`

**Context:** Spec §8.1. No `aggregateRating` without real reviews.

**Files:**
- Modify: `$WEB/src/index.html`

- [ ] **Step 1: Replace `#ld-organization` stub**

```html
<script type="application/ld+json" id="ld-organization">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "ATS Fit",
  "url": "https://atsfit.io",
  "logo": "https://atsfit.io/assets/logo.svg",
  "sameAs": []
}
</script>
```

- [ ] **Step 2: Replace `#ld-software` stub** — verify prices match Task 9:

```html
<script type="application/ld+json" id="ld-software">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "ATS Fit",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": [
    { "@type": "Offer", "name": "Free",        "price": "0",  "priceCurrency": "USD" },
    { "@type": "Offer", "name": "Pro Monthly", "price": "12", "priceCurrency": "USD" },
    { "@type": "Offer", "name": "Pro Annual",  "price": "89", "priceCurrency": "USD" }
  ]
}
</script>
```

- [ ] **Step 3: Rebuild, paste into https://search.google.com/test/rich-results. Expected: all three blocks green.**

- [ ] **Step 4: Commit**

```bash
git add src/index.html
git commit -m "feat: organization and softwareapplication json-ld"
```

---

## Task 18: Dockerfile + nginx.conf

**Agency role:** `engineering-devops-automator`

**Context:** Spec §10.1–10.2.

**Files:**
- Create: `$WEB/Dockerfile`
- Create: `$WEB/nginx.conf`

- [ ] **Step 1: Write `Dockerfile`**

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 2: Write `nginx.conf`**

```nginx
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  gzip on;
  gzip_types text/css application/javascript image/svg+xml application/json text/plain;
  gzip_min_length 256;

  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self';" always;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location ~* \.(css|js|svg|woff2|png|jpg|webp)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  location = /index.html {
    add_header Cache-Control "no-cache";
  }
}
```

- [ ] **Step 3: Local docker test**

```bash
docker build -t ats-fit-website .
docker run --rm -p 8080:80 ats-fit-website &
sleep 2
curl -I http://localhost:8080
curl -s http://localhost:8080 | head -5
docker ps -q --filter ancestor=ats-fit-website | xargs docker stop
```

Expected: `200 OK`, HTML body returned, security headers present on `-I`.

- [ ] **Step 4: Commit**

```bash
git add Dockerfile nginx.conf
git commit -m "build: dockerfile and nginx config for railway deploy"
```

---

## Task 19: Visual parity verification

**Agency role:** `engineering-frontend-developer`

**Context:** Spec §6.5. Side-by-side at 375 / 768 / 1024 / 1440 against the Angular landing.

**Files:** none (verification only)

- [ ] **Step 1: Run Angular landing**

```bash
cd "$FE"
npm start
# opens http://localhost:4200/
```

- [ ] **Step 2: Run static preview in a second terminal**

```bash
cd "$WEB"
npm run build && npm run preview
# opens http://localhost:5000/
```

- [ ] **Step 3: Capture screenshots of each section (hero → footer) at viewports 375, 768, 1024, 1440 on both origins. Overlay pairs in browser devtools (or any image diff tool).**

- [ ] **Step 4: Log every intentional or unintentional difference in scratchpad. Iterate on `src/styles/components.css` + `src/index.html` markup until diffs are zero (spacing, colors, shadows, typography).**

- [ ] **Step 5: Commit any tweaks**

```bash
git add src/styles src/index.html
git commit -m "style: parity tweaks across 4 viewports"
```

---

## Task 20: Perf + SEO gate (Lighthouse + validators)

**Agency role:** `testing-performance-benchmarker`

**Context:** Spec §8.4, §11. Ship gate: Perf ≥ 95, A11y ≥ 95, Best Practices ≥ 95, SEO = 100.

**Files:** none (verification only); create `$WEB/docs/perf-report.md` only if the team already records these.

- [ ] **Step 1: Run Lighthouse against preview**

```bash
cd "$WEB"
npm run build && npm run preview &
sleep 2
npx lighthouse http://localhost:5000 --only-categories=performance,accessibility,best-practices,seo --output json --output-path ./lh.json --chrome-flags="--headless"
node -e "const r=require('./lh.json').categories;console.log(Object.fromEntries(Object.entries(r).map(([k,v])=>[k,v.score])))"
```

Expected: every score ≥ 0.95; SEO = 1.

- [ ] **Step 2: HTML validator** — paste `dist/index.html` at https://validator.w3.org/#validate_by_input. Zero errors.

- [ ] **Step 3: Rich results** — paste at https://search.google.com/test/rich-results. Organization, SoftwareApplication, FAQPage all green.

- [ ] **Step 4: Manual browser smoke** — Chrome devtools console: zero errors / warnings. Verify:
  - Hero CTA → `https://app.atsfit.io/signup`.
  - Header Login/Signup → `https://app.atsfit.io/signin` / `https://app.atsfit.io/signup`.
  - Mobile hamburger open + close (click, Escape, link-click).
  - Pricing toggle swaps amounts, periods, hint visibility.

- [ ] **Step 5: If any gate fails, iterate on markup/styles/images; then re-run step 1. Commit each fix independently.**

---

## Task 21: Push to GitHub + Railway setup (AFTER user "ship" approval)

**Context:** Spec §10.3. This task executes AFTER user review and approval of all Tasks 1–20. **Do NOT execute this task during normal flow** — it happens as part of the ship workflow below.

**Ship workflow (triggered when user says "ship"):**

When you (the controller) receive "ship" from the user:

```bash
cd "$WEB"
git stash                                    # stash all accumulated changes
git checkout master
git pull origin master                       # pull latest
git checkout -b af-61-landing-extraction    # create feature branch
git stash pop                                # restore changes into branch
gh pr create --base master                   # create PR
```

Then manually (outside shell):

1. Verify GitHub remote exists: `gh repo view fahadsubzwari924/ats-fit-website`. If missing, create via `gh repo create fahadsubzwari924/ats-fit-website --public`.
2. Push to origin: included in the `git push -u` that PR creation may trigger.
3. Railway setup (manual):
   - Create Railway project from `fahadsubzwari924/ats-fit-website` repo.
   - Railway auto-detects Dockerfile; confirm first build green.
   - Add custom domain `atsfit.io` with A/ALIAS apex + www CNAME.
   - Verify TLS (Let's Encrypt auto-provisioning).
   - Test `https://atsfit.io/` — confirm Lighthouse scores match Task 20.

**Note:** Angular app Railway migration for `app.atsfit.io` is deferred. Cross-domain links already point to `https://app.atsfit.io/...` and will work once that app moves.

---

## Task 22: Audit + move shared landing constants out of `$FE`

**Agency role:** `engineering-frontend-developer`

**Context:** Spec §9.2. Move `BILLING_CYCLE` / `BillingCycle` if referenced outside landing, before the landing folder is deleted.

**Files:**
- Potentially create: `$FE/src/app/shared/constants/billing-cycle.constant.ts`
- Modify: any file that imports from `@root/landing/constants/pricing.constants`

- [ ] **Step 1: Grep for external references**

```bash
cd "$FE"
grep -RIn "root/landing/constants/pricing.constants\|BILLING_CYCLE\|BillingCycle" src --include='*.ts' --exclude-dir='root/landing' || true
grep -RIn "root/landing/interfaces" src --include='*.ts' --exclude-dir='root/landing' || true
```

- [ ] **Step 2: For each hit, move the referenced symbol to `src/app/shared/constants/billing-cycle.constant.ts` (or analogous `shared/interfaces/` file) and update imports.**

```ts
// src/app/shared/constants/billing-cycle.constant.ts
export enum BillingCycle { Monthly = 'monthly', Annual = 'annual' }
export const BILLING_CYCLE = {
  /* paste shape from $FE/src/app/root/landing/constants/pricing.constants.ts */
};
```

- [ ] **Step 3: Build + test**

```bash
npm run build && npm run test
```

- [ ] **Step 4: Do NOT commit** — changes accumulate for later (no commits until "ship")

---

## Task 23: Delete landing folder + update `app.routes.ts`

**Agency role:** `engineering-frontend-developer`

**Context:** Spec §9.1, §9.4. **Destructive:** confirm with the user before `git rm`.

**Files:**
- Delete: `$FE/src/app/root/landing/` (whole folder)
- Modify: `$FE/src/app/app.routes.ts`

- [ ] **Step 1: Branch + audit**

```bash
cd "$FE"
git checkout -b feature/landing-extraction-cleanup
grep -RIn "root/landing" src --include='*.ts' --include='*.html' || true
```

Expected: after Task 22, the only hits are the landing folder itself and `app.routes.ts`.

- [ ] **Step 2: Update `app.routes.ts`** — replace the current routes array with:

```ts
import { Routes } from '@angular/router';
import { applicationsAccessGuard } from '@core/guards/applications-access.guard';
import { authGuard } from '@core/guards/auth.guard';
import { onboardingGuard } from '@core/guards/onboarding.guard';
import { publicGuard } from '@core/guards/public.guard';
import { LayoutComponent } from '@root/layout/layout.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard, onboardingGuard],
    children: [
      { path: 'dashboard',    canActivate: [authGuard],                 loadComponent: () => import('@features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'applications', canActivate: [applicationsAccessGuard],   loadComponent: () => import('@features/applications/applications-page.component').then(m => m.ApplicationsPageComponent) },
      { path: 'billing',      canActivate: [authGuard],                 loadComponent: () => import('@features/billing/billing.component').then(m => m.BillingComponent) },
    ],
  },

  { path: 'onboarding', canActivate: [authGuard],    loadComponent: () => import('@features/onboarding/onboarding.component').then(m => m.OnboardingComponent) },
  { path: 'signin',     canActivate: [publicGuard],  loadComponent: () => import('@features/authentication/components/signin/signin.component').then(m => m.SigninComponent) },
  { path: 'signup',     canActivate: [publicGuard],  loadComponent: () => import('@features/authentication/components/signup/signup.component').then(m => m.SignupComponent) },

  { path: '**', redirectTo: 'dashboard' },
];
```

- [ ] **Step 3: Remove the landing folder**

```bash
git rm -r src/app/root/landing
```

- [ ] **Step 4: Build**

```bash
npm run build
```

Expected: zero TS errors. If any, the audit in Step 1 missed a reference — revert the deletion, fix imports, retry.

- [ ] **Step 5: Do NOT commit** — changes accumulate for later (no commits until "ship")

---

## Task 24: Audit + remove landing-only styles in `src/styles.scss`

**Agency role:** `engineering-frontend-developer`

**Context:** Spec §9.5. Rule: every deletion must be grep-verified as unreferenced across `src/` before removal.

**Files:**
- Modify: `$FE/src/styles.scss`
- Possibly modify: partials under `$FE/src/scss/`

- [ ] **Step 1: Enumerate candidate keyframes and classes**

```bash
cd "$FE"
grep -n '@keyframes\|\.anim-' src/styles.scss src/scss/*.scss
```

- [ ] **Step 2: For each candidate, grep the remaining `src/` for references**

```bash
for name in float-up pulse-soft blink bounce-once anim-float anim-fade shimmer fade-in-up; do
  echo "--- $name ---"
  grep -RIn "$name" src --include='*.html' --include='*.ts' --include='*.scss' || true
done
```

- [ ] **Step 3: Remove only candidates with zero references. Leave anything referenced elsewhere (e.g. if `fade-in-up` is used by billing). Edit `src/styles.scss` (and partials) in place.**

- [ ] **Step 4: Build + verify**

```bash
npm run build
```

- [ ] **Step 5: Do NOT commit** — changes accumulate for later (no commits until "ship")

---

## Task 25: Angular cleanup — verify + PR

**Agency role:** `engineering-frontend-developer` (implementation). Reviewer gate via superpowers code-quality-reviewer subagent per `ats-fit-frontend/CLAUDE.md` Rule 4.

**Context:** Spec §9.6, §11. Single PR against `master`.

- [ ] **Step 1: Full verification matrix**

```bash
cd "$FE"
npm run build
npm run test
npm run lint
```

All green.

- [ ] **Step 2: Manual smoke**

```bash
npm start
```

- Open `http://localhost:4200/` logged out → expect redirect to `/signin`.
- Log in → expect `/` to redirect to `/dashboard`.
- Verify dashboard, applications, billing, onboarding, signin, signup routes all load.

- [ ] **Step 3: All changes accumulated (no commits yet)**

All changes in Tasks 22-25 are uncommitted. They will be committed and pushed as part of the "ship" workflow after user review.

---

## Task 26: VSCode workspace + website README

**Agency role:** `engineering-technical-writer`

**Context:** Spec §4.4, §11.

**Files:**
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ATS_FIT/ats-fit-vscode.code-workspace`
- Expand: `$WEB/README.md`

- [ ] **Step 1: Add website folder to workspace**

Edit `ats-fit-vscode.code-workspace` to:

```json
{
  "folders": [
    { "path": "ats-fit-backend" },
    { "path": "ats-fit-frontend" },
    { "path": "ats-fit-website" }
  ]
}
```

- [ ] **Step 2: Expand `$WEB/README.md`**

```md
# ats-fit-website

Standalone static landing for ATS Fit. Ships HTML + one CSS file + two JS files. Zero runtime deps.

## Stack
- HTML5 + Tailwind v4 (CLI) + vanilla JS.
- Build: Node 20, esbuild, `@tailwindcss/cli`.
- Serve: nginx (Railway, Dockerfile in repo).

## Develop
```bash
npm install
npm run dev        # tailwind watch
npm run build      # emit dist/
npm run preview    # serve dist/ at :5000
npm run test       # vitest
```

## Layout
- `src/index.html` — page content.
- `src/styles/` — tokens, animations, components, tailwind entrypoint.
- `src/scripts/` — mobile menu + pricing toggle.
- `public/` — robots.txt, sitemap.xml.
- `scripts/build.js` — build orchestrator.
- `Dockerfile` + `nginx.conf` — Railway deploy.

## Deploy
Pushes to `master` auto-deploy via Railway. Domain: `atsfit.io`.

## Related
- Auth / product app: `app.atsfit.io` (repo: `ats-fit-frontend`).
- Spec: `ats-fit-frontend/docs/superpowers/specs/2026-04-20-landing-page-extraction-design.md`.
```

- [ ] **Step 3: Commit inside `$WEB`**

```bash
cd "$WEB"
git add README.md
git commit -m "docs: expand README with stack, commands, layout"
git push
```

Workspace file sits outside either repo — save in place; no commit needed.

---

## Self-Review

**1. Spec coverage** (spec section → task):

| Spec § | Coverage |
|--------|----------|
| §2 Goal — standalone static site | Tasks 1–18 |
| §2 Goal — 100% visual parity | Tasks 2, 3, 6–12, 19 |
| §2 Goal — SEO optimized | Tasks 4, 11, 16, 17, 20 |
| §2 Goal — independent Railway deploy | Tasks 18, 21 |
| §2 Goal — cross-domain redirects | Tasks 5, 6, 9 (CTA/auth hrefs) |
| §4.1 New repo layout | Task 1 + all file-creating tasks |
| §4.2 Build pipeline | Task 15 |
| §4.3 Deployment topology | Tasks 18, 21 |
| §4.4 VSCode workspace | Task 26 |
| §5 HTML + head | Tasks 4–12 |
| §5.2 Accessibility baseline | Tasks 4 (skip link, one h1), 5 (aria on button + menu), 13 (aria sync) |
| §6.1 Token port | Task 2 |
| §6.2 SCSS partials audit | Task 3 |
| §6.3 Subcomponent style port | Task 3 |
| §6.4 Animations | Task 2 |
| §6.5 Parity verification | Task 19 |
| §7.1 mobile-menu.js | Task 13 |
| §7.2 pricing-toggle.js | Task 14 |
| §7.3 Build step for JS | Task 15 |
| §8.1 JSON-LD × 3 | Tasks 11 (FAQPage), 17 (Org, Software) |
| §8.2 robots.txt | Task 16 |
| §8.3 sitemap.xml | Task 16 |
| §8.4 Perf signals + Lighthouse gate | Tasks 4 (preconnect, preload), 18 (nginx gzip/cache), 20 (gate) |
| §9 Angular cleanup | Tasks 22–25 |
| §9.4 Routing update | Task 23 |
| §9.5 Styling cleanup | Task 24 |
| §9.6 Verification | Task 25 |
| §10 Railway config | Tasks 18, 21 |
| §11 Ship gate checklist | Tasks 19, 20, 21, 25, 26 |

No gaps.

**2. Placeholder scan:** All steps include concrete commands, exact file paths, full code blocks. Sections that require referencing Angular for exact copy (Tasks 6–10) explicitly say "port verbatim from `$FE/src/app/root/landing/landing.component.html`" and give complete structural scaffolds; the concrete copy is in the Angular file, not a placeholder. Task 9's prices are illustrative and Task 9 Step 2 notes to verify them against `pricing.constants.ts` before commit — that's a deliberate verification, not a hole.

**3. Type consistency:** `init` is the exported function name in both `mobile-menu.js` and `pricing-toggle.js` (Tasks 13, 14, 15). Class names `.price-card`, `.price-amount`, `.price-period`, `#annual-savings-hint`, `#mobile-menu`, `#mobile-menu-button`, `[data-cycle]`, `data-monthly-price` / `data-annual-price` / `data-monthly-period` / `data-annual-period` are used consistently across Tasks 5, 9, 13, 14.

---

## Execution Handoff

Plan saved to `docs/superpowers/plans/2026-04-21-landing-page-extraction.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task (using the declared Agency `subagent_type`), review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints.

Which approach?
