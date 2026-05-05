# Railway Deployment Plan — ats-fit-frontend (Angular 19)

**Master plan:** see [`../DEPLOYMENT_PLAN.md`](../DEPLOYMENT_PLAN.md). This file covers the frontend repo specifically.

## Goal

Deploy Angular SPA to Railway as service `tairly-web` in the `tairly` project, served at `https://app.tairly.com` via nginx. Manual deploy via single command: `npm run deploy`. Patch deploys via Docker layer caching.

## Architecture

- **Railway project**: `tairly` (shared with `tairly-api`).
- **Service**: `tairly-web`.
- **Runtime**: nginx serving static build output (`dist/resume-maker-fe/browser`).
- **Domain**: `app.tairly.com` → Railway service. Cloudflare DNS CNAME, **proxy OFF (DNS only)** so Railway issues TLS.
- **Builder**: Dockerfile (multi-stage: node build → nginx runtime).

## Constraints / gotchas

- **No runtime env vars in browser**. API URL baked into bundle at build time via `environment.prod.ts`. Anything in JS is public — no real secrets here.
- **SPA routing**: nginx must fall back to `index.html` for unknown paths so Angular router handles them.
- **Output path**: `dist/resume-maker-fe/browser` (Angular 17+ with `application` builder). Verify in `angular.json` before first deploy.
- **Caching headers**: hashed assets (`*.js`, `*.css`) get `immutable, max-age=1y`. `index.html` gets `no-cache` so new deploys pick up immediately.
- **Port**: nginx must listen on `$PORT` (Railway-injected). Use envsubst at container start via nginx's built-in template feature.
- **Subdomain**: `app.tairly.com` is added as a CNAME in **Cloudflare DNS**, not Namecheap. (Namecheap is registrar only — Cloudflare is authoritative DNS. See master plan phase 2.)

## Tasks

### 1. Verify prod environment config

- [ ] Open `src/environments/environment.prod.ts`. Confirm or set:
  ```ts
  export const environment = {
    production: true,
    apiUrl: 'https://api.tairly.com',
  };
  ```
- [ ] Open `src/environments/environment.ts` (dev). Confirm it points to local API:
  ```ts
  export const environment = {
    production: false,
    apiUrl: 'http://localhost:3000',
  };
  ```
- [ ] Open `angular.json`. Confirm the `production` configuration has file replacement:
  ```json
  "fileReplacements": [
    { "replace": "src/environments/environment.ts", "with": "src/environments/environment.prod.ts" }
  ]
  ```
- [ ] Audit all `environment.*.ts` for accidentally-committed secrets — anything sensitive must be removed (frontend bundles are 100% public).
- [ ] Grep services + interceptors for hardcoded `http://localhost` or `https://api.` URLs — they must read from `environment.apiUrl`:
  ```bash
  grep -r "http://" src/app/ | grep -v environment | grep -v node_modules
  ```

### 2. Verify Angular output path

- [ ] In `angular.json`, find `architect.build.options.outputPath`. Should be `dist/resume-maker-fe`. Angular 17+ writes the actual SPA bundle to `<outputPath>/browser` automatically.
- [ ] Run `npm run build -- --configuration=production` locally and confirm `dist/resume-maker-fe/browser/index.html` exists. If your output path is different, update step 3 (Dockerfile) accordingly.

### 3. Dockerfile (new file at repo root)

Create `Dockerfile`:

```dockerfile
# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration=production

# ---- runtime stage ----
FROM nginx:alpine AS runtime
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/resume-maker-fe/browser /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

`nginx:alpine` auto-runs envsubst on `/etc/nginx/templates/*.template` → `/etc/nginx/conf.d/*` at start, substituting `$PORT`.

### 4. `nginx.conf.template` (new file at repo root)

```nginx
server {
  listen ${PORT};
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  gzip on;
  gzip_vary on;
  gzip_min_length 1024;
  gzip_types text/plain text/css application/javascript application/json image/svg+xml;

  # SPA fallback
  location / {
    try_files $uri $uri/ /index.html;
  }

  # hashed assets — cache forever
  location ~* \.(js|css|woff2|svg|png|jpg|jpeg|gif|ico)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    try_files $uri =404;
  }

  # never cache index.html
  location = /index.html {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
  }

  # security headers
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

### 5. `.dockerignore` (new file at repo root)

```
node_modules
dist
.git
.angular
.vscode
.idea
.claude
.ai
coverage
*.log
docs
vendor
*.md
.github
```

### 6. `railway.toml` (new file at repo root)

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
healthcheckPath = "/"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

### 7. Railway env vars

None required. The frontend bundle is fully static after build — there are no runtime env vars.

`PORT` is auto-injected by Railway and consumed by nginx via the template.

### 8. One-time Railway service setup

- [ ] Railway dashboard → open existing `tairly` project → **+ New** → **Empty Service** → name `tairly-web`.
- [ ] In `ats-fit-frontend/` locally:
  ```bash
  railway link        # select tairly → tairly-web
  ```

### 9. Custom subdomain setup (Cloudflare DNS, not Namecheap)

> Subdomain DNS is managed in **Cloudflare**, not Namecheap. Namecheap is your registrar; Cloudflare nameservers (set up per master plan phase 2) own all records for `tairly.com`. Do NOT add an `app` record in Namecheap — it will be ignored.

- [ ] Railway dashboard → `tairly-web` service → Settings → Networking → **Custom Domain** → enter `app.tairly.com`.
- [ ] Railway shows a CNAME target like `xxxxxxx.up.railway.app`. Copy it.
- [ ] Cloudflare dashboard → `tairly.com` → DNS → Records → **Add record**:
  - Type: `CNAME`
  - Name: `app`
  - Target: `<paste-railway-cname>`
  - Proxy status: **DNS only** (grey cloud) — required so Railway can issue TLS via Let's Encrypt
  - TTL: Auto
- [ ] Wait 1–2 minutes. Verify:
  ```bash
  dig app.tairly.com +short          # should return Railway hostname
  curl -I https://app.tairly.com     # should return 200 once cert issues
  ```
- [ ] If `curl` shows SSL error after 5 min: in Railway dashboard, the custom domain row will show an error (usually "proxy enabled" or wrong target). Fix and retry.

### 10. Single deploy script (`scripts/deploy.sh`)

Create the only deploy entry point.

```bash
mkdir -p scripts
```

Create `scripts/deploy.sh`:

```bash
#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# tairly-web — single-shot Railway deploy
# Usage: npm run deploy
# ---------------------------------------------------------------------------
set -euo pipefail

SERVICE="tairly-web"
APP_URL="https://app.tairly.com"
EXPECTED_API_URL="https://api.tairly.com"

echo "▶ Preflight: railway CLI present?"
command -v railway >/dev/null 2>&1 || { echo "❌ railway CLI not installed. Run: npm i -g @railway/cli"; exit 1; }

echo "▶ Preflight: logged in to Railway?"
railway whoami >/dev/null 2>&1 || { echo "❌ Not logged in. Run: railway login"; exit 1; }

echo "▶ Preflight: linked to a Railway service?"
railway status >/dev/null 2>&1 || { echo "❌ Not linked. Run: railway link"; exit 1; }

echo "▶ Lint"
npm run lint

echo "▶ Production build (local sanity check — Railway will rebuild in container)"
npm run build -- --configuration=production

echo "▶ Verifying production bundle has correct API URL baked in..."
if ! grep -rq "${EXPECTED_API_URL}" dist/resume-maker-fe/browser/ 2>/dev/null; then
  echo "❌ Could not find ${EXPECTED_API_URL} in built bundle."
  echo "   Check src/environments/environment.prod.ts and angular.json fileReplacements."
  exit 1
fi
echo "  ✓ ${EXPECTED_API_URL} present in bundle."

echo "▶ Deploying to Railway service: ${SERVICE}"
railway up --service "${SERVICE}" --environment production --detach

echo "▶ Deploy submitted. Tailing build/runtime logs..."
railway logs --service "${SERVICE}" &
LOGS_PID=$!

sleep 90

echo "▶ Smoke test: ${APP_URL}"
for attempt in {1..10}; do
  STATUS=$(curl -sf -o /dev/null -w "%{http_code}" "${APP_URL}" || true)
  if [ "${STATUS}" = "200" ]; then
    echo "✅ ${APP_URL} returned 200 — deploy looks healthy."
    kill ${LOGS_PID} 2>/dev/null || true
    exit 0
  fi
  echo "  attempt ${attempt}/10 — got HTTP ${STATUS:-???}, retrying in 15s..."
  sleep 15
done

echo "⚠️  ${APP_URL} did not return 200 after 10 attempts."
echo "   Check Railway dashboard or run: railway logs --service ${SERVICE}"
echo "   Rollback if needed: railway rollback --service ${SERVICE}"
kill ${LOGS_PID} 2>/dev/null || true
exit 1
```

Make executable:
```bash
chmod +x scripts/deploy.sh
```

### 11. Wire single command in `package.json`

Add to `scripts`:

```json
"scripts": {
  "ng": "ng",
  "start": "ng serve",
  "build": "ng build",
  "watch": "ng build --watch --configuration development",
  "test": "ng test",
  "lint": "ng lint",
  "deploy": "bash scripts/deploy.sh"
}
```

`npm run deploy` is the only command needed for production deploys.

### 12. First deploy + verification

- [ ] Local sanity: `docker build -t tairly-web . && docker run --rm -p 8080:8080 -e PORT=8080 tairly-web` → open `http://localhost:8080`.
- [ ] Verify SPA deep-link refresh works: navigate to a sub-route, hit refresh, should not 404.
- [ ] Verify console shows no errors and Network tab shows requests going to `https://api.tairly.com` (will fail until backend is live on that domain — that's fine for local Docker test).
- [ ] `npm run deploy`.
- [ ] After custom domain wired (master plan phase 5): open `https://app.tairly.com` in incognito. Login flow + API call works against `api.tairly.com`.
- [ ] Verify CORS: zero console errors when calling the API.
- [ ] `curl -I https://app.tairly.com` → 200 with correct cache headers (no-cache for index.html).

### 13. Post-deploy hygiene

- [ ] Update `README.md`: add a "Deploy" section pointing at `npm run deploy`.
- [ ] Verify bundle size acceptable (Angular CLI prints transferred size at end of build). If bundle exceeds budget warnings, address in a follow-up.

## Patch-deploy mechanism

- `package*.json` copied before source → `npm ci` cached on lock-file-unchanged builds.
- nginx runtime stage tiny + stable → no rebuild unless config changes.
- `.dockerignore` keeps context lean.
- Code-only deploy ≈ 60–90s. Dep change ≈ 2–4 min.

## Rollback

```bash
railway rollback --service tairly-web
```

## Open items / decide later

- CDN: Railway serves directly. Cloudflare proxy in front of Railway is possible but requires Full (strict) TLS mode + origin cert. Defer.
- Sentry frontend: out of scope now.
- Bundle analyzer / size budgets: configure later if needed.
