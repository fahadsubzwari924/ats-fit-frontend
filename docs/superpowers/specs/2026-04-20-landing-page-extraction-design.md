# Landing Page Extraction — Design Spec

**Date:** 2026-04-20
**Status:** Approved (brainstorming phase complete)
**Author:** Fahad Subzwari (with Claude)

---

## 1. Problem

The ATS Fit public landing page currently ships as a route inside the Angular `ats-fit-frontend` app. Because visitors must download the full Angular runtime, Material, Tailwind, and all feature-module chunks before the homepage becomes usable, first paint is slow. The page also forces an authenticated-app shell (shared `LayoutComponent`, header, footer) onto a public marketing route that does not need it.

Marketing surfaces benefit disproportionately from fast loads (SEO ranking signal, bounce rate, ad conversion). A framework-heavy landing is the wrong tool for the job.

## 2. Goal

Extract the landing page from `ats-fit-frontend` into a new standalone static site (`ats-fit-website`) that:

- Loads dramatically faster (no framework runtime, no network calls on first paint).
- Preserves **100% visual parity** with the current Angular landing — colors, typography, spacing, shadows, animations, responsive behavior, and component visuals must be indistinguishable from today's production landing.
- Is SEO-optimized (structured data, semantic HTML, perf, sitemap, robots).
- Deploys independently on Railway at the apex domain `atsfit.io`.
- Redirects users into the Angular app at `app.atsfit.io` for auth/signup and the authenticated product experience.

Non-goals (out of scope for v1):

- Blog, changelog, legal pages (folder layout supports future addition; not built now).
- Analytics (deferred; add in v2).
- Dynamic content fetching from the backend (all content hardcoded in HTML).
- Angular app's GCP → Railway migration (separate follow-up PR).
- CI/CD pipeline (Railway auto-deploy-on-push is sufficient for v1).

## 3. Decisions (from brainstorming)

| # | Decision | Choice |
|---|---|---|
| Q1 | Tooling | Tailwind CLI compiles static CSS; plain HTML + vanilla JS; no Vite/Parcel |
| Q2 | Content data | Hardcoded in HTML (features, pricing, testimonials) |
| Q3 | Hero CTA | "Get Started" → redirects to `https://app.atsfit.io/signup` |
| Q4 | Deployment topology | `atsfit.io` → landing; `app.atsfit.io` → Angular app |
| Q5 | Chrome | Full header + full footer ported; mobile hamburger (vanilla JS); anchor nav to sections |
| Q6 | Pricing toggle | Vanilla JS toggle mirrors current Angular behavior (Monthly ⇄ Annual) |
| Q7 | SEO scope | Baseline + structured data + perf signals + FAQ section |
| Q8 | Folder name | `ats-fit-website` |
| Q9 | Angular cleanup | Delete `src/app/root/landing/` folder; root `/` → redirect to `/dashboard`; keep `LayoutComponent`/header/footer (still used by authed pages) |
| Q10 | Analytics | None for v1 |

## 4. Architecture

### 4.1 New repo: `ats-fit-website`

- Local path: `/Users/fahadsubzwari924/Documents/sideProjects/ATS_FIT/ats-fit-website/`
- Remote: `git@github.com:fahadsubzwari924/ats-fit-website.git`

```
ats-fit-website/
├── src/
│   ├── index.html              # landing page (all content hardcoded)
│   ├── assets/
│   │   ├── favicon.svg
│   │   ├── og-image.png
│   │   └── logo.svg
│   ├── styles/
│   │   ├── tailwind.css        # @tailwind base/components/utilities + @theme
│   │   ├── tokens.css          # :root { --ats-* } — copied from frontend
│   │   └── components.css      # ported subcomponent styles + custom rules
│   └── scripts/
│       ├── mobile-menu.js      # hamburger toggle (~25 lines)
│       └── pricing-toggle.js   # Monthly/Annual swap (~30 lines)
├── public/
│   ├── robots.txt
│   └── sitemap.xml
├── scripts/
│   └── build.js                # copies html/assets/js → dist, minifies JS
├── dist/                       # build output (served by nginx on Railway)
├── tailwind.config.js          # mirrors frontend config
├── package.json                # scripts: build, dev, preview
├── Dockerfile                  # multi-stage: node build → nginx serve
├── nginx.conf                  # static serving + SEO/security headers
├── .gitignore
└── README.md
```

Runtime deps: zero. Dev deps: `tailwindcss`, `@tailwindcss/cli`, `esbuild` (minifies JS), `serve` (local preview).

### 4.2 Build pipeline

```
src/styles/tailwind.css  ──[tailwindcss CLI]──▶  dist/styles.css (minified)
src/index.html           ──[copy]──────────────▶ dist/index.html
src/scripts/*.js         ──[esbuild --minify]──▶ dist/*.js
src/assets/*             ──[copy]──────────────▶ dist/assets/*
public/*                 ──[copy]──────────────▶ dist/*
```

`npm run build` runs the above. Railway runs it inside the Docker build stage.

### 4.3 Deployment topology

- `atsfit.io` → Railway service #1 serving `ats-fit-website` via nginx (Dockerfile).
- `app.atsfit.io` → Railway service #2 serving `ats-fit-frontend` (existing Dockerfile).
- Cross-domain links: landing's Login/Signup buttons point to `https://app.atsfit.io/signin` and `https://app.atsfit.io/signup` as absolute URLs.
- TLS auto-provisioned by Railway (Let's Encrypt).
- No CORS impact (landing is static, makes no XHR to backend).

### 4.4 VSCode workspace

Update `/Users/fahadsubzwari924/Documents/sideProjects/ATS_FIT/ats-fit-vscode.code-workspace`:

```json
{
  "folders": [
    { "path": "ats-fit-backend" },
    { "path": "ats-fit-frontend" },
    { "path": "ats-fit-website" }
  ]
}
```

## 5. HTML structure

Single `src/index.html` with semantic HTML5 and full SEO head:

```html
<!DOCTYPE html>
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
  <meta property="og:description" content="…">
  <meta property="og:image" content="https://atsfit.io/assets/og-image.png">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="…">
  <meta name="twitter:description" content="…">
  <meta name="twitter:image" content="https://atsfit.io/assets/og-image.png">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" href="/styles.css" as="style">

  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <meta name="theme-color" content="#2563EB">

  <link rel="stylesheet" href="/styles.css">

  <script type="application/ld+json">{ Organization schema }</script>
  <script type="application/ld+json">{ SoftwareApplication schema with Offer }</script>
  <script type="application/ld+json">{ FAQPage schema }</script>
</head>
<body>
  <a href="#main" class="skip-to-content">Skip to content</a>

  <header>
    <nav>
      <!-- Logo + desktop nav (#features, #pricing, #testimonials, #faq) + Login / Signup buttons -->
      <!-- Mobile hamburger button -->
    </nav>
    <nav id="mobile-menu" aria-hidden="true">…</nav>
  </header>

  <main id="main">
    <section id="hero">…</section>
    <section id="problem-solution">…</section>
    <section id="features">…</section>
    <section id="pricing">…</section>
    <section id="testimonials">…</section>
    <section id="faq">…</section>
  </main>

  <footer>…</footer>

  <script src="/mobile-menu.js" defer></script>
  <script src="/pricing-toggle.js" defer></script>
</body>
</html>
```

### 5.1 Section parity

Each section in the static HTML is a one-to-one visual port of the current Angular landing, per section order in `ats-fit-frontend/src/app/root/landing/landing.component.html`:

1. **Hero** — AI-powered badge, gradient headline, sub-copy, "Get Started" CTA → `https://app.atsfit.io/signup`, trust-bar card with 3 stats (95% / 3x / <60s).
2. **Problem/Solution** — two cards (red and green) with identical copy.
3. **Features** — 3-column grid of feature cards. Each card: icon, title, description. Cards hardcoded from current `features()` list.
4. **Pricing** — billing-cycle toggle (Monthly/Annual) + 2 plans side by side. JS swaps prices live; "Save 38%" badge + "You save $55/year" hint.
5. **Testimonials** — 3-column grid of testimonial cards. Hardcoded from current `testimonials()` list.
6. **FAQ (new)** — 6–10 questions/answers in accordion or open-by-default list. Styled to match card language. Used for `FAQPage` JSON-LD.

### 5.2 Accessibility baseline

- One `<h1>` per page (hero). `<h2>` per section.
- Icon-only buttons have `aria-label`.
- Skip-to-content link.
- All `<img>` have `alt`.
- Focus styles preserved (use existing `--color-ring` token).
- Mobile menu: `aria-expanded`, `aria-controls`, `aria-hidden`.

## 6. Styling strategy (100% parity)

### 6.1 Token port

Copy verbatim from `ats-fit-frontend/src/styles.scss` into `src/styles/tokens.css`:

- The `@theme { … }` block (Tailwind v4 theme tokens: colors, fonts, radii).
- The `:root { --ats-* … }` block (design-system custom properties).

Tailwind v4 reads `@theme` from plain CSS — no SCSS needed.

### 6.2 SCSS partials audit

Of the partials in `ats-fit-frontend/src/scss/`, port only:

- `_base.scss` (global body/html resets, Inter font)
- `_design-tokens.scss` (already covered by tokens.css)
- `_app-header.scss` (header-specific rules)
- `_buttons.scss` (CTA button rules used on landing)
- `_components.scss` — **audit and port only the rules referenced by the landing HTML**
- `_utilities.scss` — **audit and port only the rules referenced by the landing HTML**

Skip: `_billing.scss`, `_forms.scss`, `_resume-diff.scss`, `_toast.scss`, `_mixins.scss` (SCSS-only).

### 6.3 Subcomponent style port

Four Angular subcomponents have dedicated SCSS files. Flatten into named blocks in `src/styles/components.css`:

- `feature-card.component.scss` → `.feature-card { … }`
- `job-story-card.component.scss` → `.testimonial-card { … }`
- `price-card.component.scss` → `.price-card { … }`
- `section-title-and-detail.component.scss` → `.section-title { … }` (if used; remove if not)

Class names align with the static HTML markup. No BEM changes.

### 6.4 Animations

Port only keyframes referenced by landing markup: `fade-in-up`, `shimmer` (if used). Drop `float-up`, `pulse-soft`, `blink`, `bounce-once` if they are landing-unused (verify with grep during implementation).

### 6.5 Parity verification

Take screenshots of the current Angular landing at 375px, 768px, 1024px, 1440px viewport widths. Take matching screenshots of the new static site. Pixel-diff visually (eyeball + overlay in browser devtools). Zero intentional style differences permitted.

## 7. JS behavior

### 7.1 `mobile-menu.js` (~25 lines, ES6, no deps)

Contract:
- Element `#mobile-menu-button` toggles class `.is-open` on `#mobile-menu`.
- Syncs `aria-expanded` on button and `aria-hidden` on menu.
- Closes menu on (a) anchor link click inside menu, (b) Escape key.
- No focus trap in v1.

### 7.2 `pricing-toggle.js` (~30 lines, ES6, no deps)

Contract:
- Buttons `[data-cycle="monthly"]` and `[data-cycle="annual"]` toggle active state and `aria-pressed`.
- Each `.price-card` carries `data-monthly-price`, `data-annual-price`, `data-monthly-period`, `data-annual-period` attributes.
- On toggle: updates `.price-amount` text, `.price-period` text per card.
- Toggles `.hidden` on `#annual-savings-hint`.

Default state (no JS execution): Monthly is selected. Full page is usable without JS — graceful degradation and crawler-friendly.

### 7.3 Build step for JS

`esbuild src/scripts/*.js --minify --outdir=dist` (invoked from `scripts/build.js`). Total shipped JS: ≈ 2 KB gzipped. No source maps in production.

## 8. SEO deliverables

### 8.1 Structured data (JSON-LD in `<head>`)

- **Organization** — `name`, `url`, `logo`, `sameAs` (social links if any).
- **SoftwareApplication** — `name`, `applicationCategory: BusinessApplication`, `operatingSystem: Web`, `offers` array with Free + Pro (monthly + annual) + prices. No `aggregateRating` unless we have real reviews.
- **FAQPage** — one `Question` + `Answer` entry per FAQ item on the page.

### 8.2 `public/robots.txt`

```
User-agent: *
Allow: /
Sitemap: https://atsfit.io/sitemap.xml
```

### 8.3 `public/sitemap.xml`

Single-URL sitemap for `https://atsfit.io/`, `lastmod` set at build time.

### 8.4 Perf signals

- `<link rel="preconnect">` for Google Fonts origins.
- `<link rel="preload" as="style">` for `/styles.css`.
- `defer` on both JS files.
- Images have explicit `width` and `height` (avoid CLS).
- Below-the-fold images use `loading="lazy"`.
- Fonts use `font-display: swap`.
- nginx: gzip + 1-year cache for static assets, no-cache for HTML.

Lighthouse ship gate: Perf ≥ 95, Accessibility ≥ 95, Best Practices ≥ 95, SEO = 100.

## 9. Angular app cleanup (`ats-fit-frontend`)

Single PR against `master`.

### 9.1 Deletions

- `src/app/root/landing/` — entire folder (component, subcomponents, services, interfaces, constants, enums).
- Landing-only animations in `src/styles.scss` (grep-audit first; keep anything referenced elsewhere).

### 9.2 Move (not delete) where needed

- If `BILLING_CYCLE` / `BillingCycle` from `@root/landing/constants/pricing.constants` is referenced outside landing (e.g. by the billing feature), move to `src/app/shared/constants/` before deleting its old home.
- `IPricing` / `IFeature` / `ITestimonial` — delete if landing-only (expected); grep-verify.

### 9.3 Keep

- `LayoutComponent` and `src/app/root/layout/components/{header,footer}` — still wrap all authenticated pages.
- `authGuard`, `publicGuard`, `onboardingGuard`, `applicationsAccessGuard`.
- All feature modules (dashboard, applications, billing, authentication, onboarding, resume-tailoring, apply-new-job, tailor-apply).
- `PlatformDataService` backend endpoints on `ats-fit-backend` — leave untouched (flag as future-cleanup candidate).

### 9.4 Routing update — `src/app/app.routes.ts`

```ts
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard, onboardingGuard],
    children: [
      { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('@features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'applications', canActivate: [applicationsAccessGuard], loadComponent: () => import('@features/applications/applications-page.component').then(m => m.ApplicationsPageComponent) },
      { path: 'billing', canActivate: [authGuard], loadComponent: () => import('@features/billing/billing.component').then(m => m.BillingComponent) },
    ],
  },

  { path: 'onboarding', canActivate: [authGuard], loadComponent: () => import('@features/onboarding/onboarding.component').then(m => m.OnboardingComponent) },
  { path: 'signin', canActivate: [publicGuard], loadComponent: () => import('@features/authentication/components/signin/signin.component').then(m => m.SigninComponent) },
  { path: 'signup', canActivate: [publicGuard], loadComponent: () => import('@features/authentication/components/signup/signup.component').then(m => m.SignupComponent) },

  { path: '**', redirectTo: 'dashboard' },
];
```

Behavior:
- `app.atsfit.io/` → redirects to `/dashboard`.
- `authGuard` catches unauthenticated users and redirects them to `/signin`.
- Unknown paths → `/dashboard` (then authGuard handles).

### 9.5 Styling cleanup — `src/styles.scss`

Keep (used app-wide): `@theme`, `:root` vars, `@layer base`, Material dialog overrides, `result-*` stat card rules.

Audit & remove if landing-only: `float-up`, `pulse-soft`, `blink`, `anim-float*`, `anim-fade` keyframes and utility classes.

**Rule:** Every deletion MUST be grep-verified as unreferenced across `src/` before removal. Zero silent deletions.

### 9.6 Verification

- `npm run build` — passes
- `npm run test` — passes (spec files under deleted folders auto-removed with folder)
- `npm run lint` — passes
- Manual smoke: logged out → `app.atsfit.io/` redirects to `/signin`. Logged in → `app.atsfit.io/` lands on `/dashboard`.

## 10. Railway deployment config

### 10.1 Dockerfile (in `ats-fit-website/`)

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

### 10.2 `nginx.conf`

Static serving with:
- `gzip on` for text/css, js, svg, json
- 1-year `Cache-Control: public, immutable` for `*.css|*.js|*.woff2|*.svg|*.png|*.jpg|*.webp`
- `no-cache` for `/index.html` (so content updates ship instantly)
- Security headers: `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, strict `Content-Security-Policy`.
- `try_files $uri $uri/ /index.html;` catch-all.

### 10.3 Git + Railway setup

**Repo bootstrap (first commit, push to existing remote):**

```bash
cd /Users/fahadsubzwari924/Documents/sideProjects/ATS_FIT/ats-fit-website
git init
git remote add origin git@github.com:fahadsubzwari924/ats-fit-website.git
git branch -M master
git add .
git commit -m "chore: bootstrap static landing site"
git push -u origin master
```

**Railway:**

1. Create Railway project; add service connected to `github.com/fahadsubzwari924/ats-fit-website`.
2. Railway auto-detects the Dockerfile, builds, deploys on every push to `master`.
3. Add custom domain `atsfit.io` → set apex A/ALIAS record and www CNAME at DNS provider.
4. TLS auto-provisioned (Let's Encrypt).
5. Repeat for `ats-fit-frontend` on `app.atsfit.io` as a separate Railway service (out of scope for this PR; tracked as follow-up).

## 11. Ship gate (verification checklist)

- [ ] `npm run build` in `ats-fit-website/` produces `dist/` with `index.html`, `styles.css`, `mobile-menu.js`, `pricing-toggle.js`, `assets/*`, `robots.txt`, `sitemap.xml`.
- [ ] `npm run preview` serves locally; side-by-side with the Angular landing: visual parity at 375 / 768 / 1024 / 1440 widths.
- [ ] Lighthouse on local preview: Perf ≥ 95, Accessibility ≥ 95, Best Practices ≥ 95, SEO = 100.
- [ ] HTML validates at validator.w3.org.
- [ ] Structured data validates at search.google.com/test/rich-results (all three JSON-LD blocks green).
- [ ] `robots.txt` and `sitemap.xml` reachable at root paths.
- [ ] Header Login/Signup buttons link to `https://app.atsfit.io/signin` and `https://app.atsfit.io/signup`.
- [ ] Hero "Get Started" CTA links to `https://app.atsfit.io/signup`.
- [ ] Mobile hamburger opens and closes (click, Escape, link-click).
- [ ] Pricing toggle swaps prices + period labels + savings hint.
- [ ] Zero console errors/warnings in browser.
- [ ] `ats-fit-frontend`: `npm run build` + `npm run test` + `npm run lint` all green.
- [ ] `ats-fit-frontend`: logged-out `/` → `/signin`; logged-in `/` → `/dashboard`.
- [ ] `ats-fit-vscode.code-workspace` includes `ats-fit-website` folder.

## 12. Open items / follow-ups (deferred)

- Analytics (Plausible recommended for v2).
- Angular app Railway migration from GCP Cloud Run (separate PR).
- CI on GitHub Actions (Railway auto-deploy suffices for v1).
- Blog / changelog / legal pages inside `ats-fit-website` (folder structure accommodates).
- Potential backend cleanup of `PlatformDataService` endpoints if fully unused after extraction.
