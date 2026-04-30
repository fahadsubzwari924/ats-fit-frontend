# Railway Deployment Plan — ats-fit-frontend (Angular 19)

## Goal

Deploy Angular SPA to Railway as service `tairly-web`, served at `https://app.tairly.com` via nginx. Manual deploy via `npm run deploy:prod`. Patch deploys via Docker layer caching.

## Architecture

- **Railway project**: `tairly` (shared with `tairly-api`).
- **Service**: `tairly-web`.
- **Runtime**: nginx serving static build output (`dist/resume-maker-fe/browser`).
- **Domain**: `app.tairly.com` → Railway service. Cloudflare DNS CNAME, proxy OFF (DNS only) so Railway issues TLS.
- **Builder**: Dockerfile (multi-stage: node build → nginx runtime).

## Constraints / gotchas

- **No runtime env vars in browser**. API URL baked into bundle via `environment.prod.ts`. Anything in JS is public — no real secrets here.
- **SPA routing**: nginx must fall back to `index.html` for unknown paths so Angular router handles them.
- **Output path**: `dist/resume-maker-fe/browser` (Angular 17+ with `application` builder). Confirm in `angular.json`.
- **Caching headers**: hashed assets (`*.js`, `*.css`) get `immutable, max-age=1y`. `index.html` gets `no-cache` so new deploys pick up immediately.
- **Port**: nginx listens on `$PORT` (Railway-injected). Use envsubst at container start, OR listen on `8080` and rely on Railway port mapping. Envsubst is cleaner.

## Tasks

### 1. Railway service setup (one-time, manual)

- [ ] Reuse `tairly` Railway project (same as backend).
- [ ] Create empty service `tairly-web` (dashboard → New → Empty Service).
- [ ] In repo root: `railway link` → pick `tairly` project + `tairly-web` service.

### 2. Verify env config

- [ ] Confirm `src/environments/environment.prod.ts` has:
  ```ts
  export const environment = {
    production: true,
    apiUrl: 'https://api.tairly.com',
  };
  ```
- [ ] Confirm `src/environments/environment.ts` (dev) points to local API (e.g. `http://localhost:3000`).
- [ ] Confirm `angular.json` `production` configuration has file replacement: `environment.ts` → `environment.prod.ts`.
- [ ] Audit all `environment.*.ts` for accidentally-committed secrets — anything sensitive must be removed (frontend bundles are public).
- [ ] Audit `app.module.ts` and services to ensure they import from `environment`, not hardcoded URLs.

### 3. Dockerfile (new file at repo root)

Multi-stage:

```dockerfile
# build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration=production

# runtime stage
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
coverage
*.log
docs
vendor
*.md
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

Set `PORT=8080` only (Railway sets this automatically — explicit set is redundant but safe). No other vars needed for frontend.

### 8. Custom domain

- [ ] Railway dashboard → `tairly-web` service → Settings → Networking → Custom Domain → `app.tairly.com`.
- [ ] Cloudflare DNS: add CNAME `app` → Railway target. Proxy DNS only (grey cloud).
- [ ] Wait for cert issuance.

### 9. Deploy script

Add to `package.json`:

```json
"scripts": {
  "predeploy:prod": "npm run lint && npm run build -- --configuration=production",
  "deploy:prod": "railway up --service tairly-web --environment production --detach"
}
```

`predeploy:prod` lints + builds locally first. Catch errors before upload.

### 10. First deploy + verification

- [ ] Local sanity: `docker build -t tairly-web . && docker run --rm -p 8080:8080 -e PORT=8080 tairly-web` → open `http://localhost:8080`.
- [ ] Verify SPA routes work (refresh on a deep link should not 404).
- [ ] `npm run deploy:prod`.
- [ ] `railway logs --service tairly-web`.
- [ ] `curl -I https://app.tairly.com` → 200 with correct cache headers.
- [ ] Open `https://app.tairly.com` in browser, login flow + API call works against `api.tairly.com`.
- [ ] Verify CORS works (no console errors).

### 11. Post-deploy hygiene

- [ ] Document deploy in `docs/DEPLOYMENT.md`.
- [ ] Verify bundle size acceptable. Railway logs show transferred size.

## Patch-deploy mechanism

- `package*.json` copied before source → `npm ci` cached on lock-file-unchanged builds.
- nginx runtime stage tiny + stable → no rebuild unless config changes.
- `.dockerignore` keeps context lean.
- Code-only deploy ≈ 60–90s. Dep change ≈ 2–4 min.

## Rollback

`railway rollback --service tairly-web`.

## Open items / decide later

- CDN: Railway serves directly. If global perf matters later, put Cloudflare in front (proxy ON) — but Railway TLS becomes invalid behind Cloudflare proxy unless using Full (strict) mode with origin cert. Defer.
- Sentry frontend: out of scope now.
- Bundle analyzer / size budgets: configure later if needed.
