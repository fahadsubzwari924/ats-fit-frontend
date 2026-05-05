#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# tairly-web — Railway deploy
# Usage: npm run deploy
# ---------------------------------------------------------------------------
set -euo pipefail

SERVICE="tairly-web"
EXPECTED_API_URL="https://api.tairly.com"
HEALTH_URL="${HEALTH_URL:-}"

echo "▶ Checking railway CLI..."
command -v railway >/dev/null 2>&1 || {
  echo "❌ railway CLI not found. Run: npm i -g @railway/cli"
  exit 1
}

echo "▶ Checking Railway login..."
railway whoami >/dev/null 2>&1 || {
  echo "❌ Not logged in. Run: railway login"
  exit 1
}

echo "▶ Checking Railway project link..."
railway status >/dev/null 2>&1 || {
  echo "❌ Not linked to a Railway project. Run: railway link"
  exit 1
}

echo "▶ Lint..."
npm run lint

echo "▶ Production build (local sanity check)..."
npm run build -- --configuration=production

echo "▶ Verifying API URL baked into bundle..."
if ! grep -rq "${EXPECTED_API_URL}" dist/resume-maker-fe/browser/ 2>/dev/null; then
  echo "❌ Could not find ${EXPECTED_API_URL} in built bundle."
  echo "   Check src/environments/environment.prod.ts and angular.json fileReplacements."
  exit 1
fi
echo "  ✓ ${EXPECTED_API_URL} present in bundle."

echo "▶ Deploying ${SERVICE} to Railway..."
railway up --service "${SERVICE}" --environment production --detach

echo ""
echo "▶ Deployment submitted. Streaming logs (Ctrl-C to detach — deploy continues in Railway)..."
railway logs --service "${SERVICE}" &
LOGS_PID=$!

echo "▶ Waiting 90s for Railway to build and boot..."
sleep 90

# Resolve smoke-test URL
if [ -z "${HEALTH_URL}" ]; then
  PUBLIC_DOMAIN=$(railway domain --service "${SERVICE}" 2>/dev/null \
    | grep -oE 'https://[a-zA-Z0-9.-]+\.up\.railway\.app' \
    | head -1)
  if [ -n "${PUBLIC_DOMAIN}" ]; then
    HEALTH_URL="${PUBLIC_DOMAIN}"
  else
    echo "⚠️  Could not resolve Railway public domain. Skipping smoke test."
    kill "${LOGS_PID}" 2>/dev/null || true
    exit 0
  fi
fi

echo ""
echo "▶ Smoke test: ${HEALTH_URL}"
for attempt in $(seq 1 10); do
  HTTP_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" "${HEALTH_URL}" || echo "000")
  if [ "${HTTP_STATUS}" = "200" ]; then
    echo "✅ Smoke test passed (HTTP 200) — deploy successful."
    kill "${LOGS_PID}" 2>/dev/null || true
    exit 0
  fi
  echo "   Attempt ${attempt}/10 — got HTTP ${HTTP_STATUS}, retrying in 15s..."
  sleep 15
done

echo ""
echo "⚠️  Smoke test did not return 200 after 10 attempts."
echo "   Check Railway dashboard for build/boot errors."
echo "   To roll back: railway rollback --service ${SERVICE}"
kill "${LOGS_PID}" 2>/dev/null || true
exit 1
