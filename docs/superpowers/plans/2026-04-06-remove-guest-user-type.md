# Remove Guest User Type Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the guest user bifurcation completely and support only authenticated users on `freemium` or `premium` plans across backend and frontend.

**Architecture:** Backend becomes registered-user-only and plan-based (`freemium | premium`) with JWT required for all product actions. Guest identity (`user_type=guest`, `guest_id`, guest-fallback middleware behavior) is removed from domain, persistence, and rate-limiting. Frontend removes guest enums/copy/guards/model fields and consumes a strict authenticated + plan-only contract.

**Tech Stack:** NestJS + TypeORM + PostgreSQL (`ats-fit-backend`), Angular (`ats-fit-frontend`), existing Jest/unit/e2e test setup.

---

### Task 1: Add failing backend tests for "no guest fallback"

**Files:**
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend/src/shared/middlewares/user-context.middleware.ts`
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend/src/modules/rate-limit/rate-limit.controller.ts`
- Test: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend/test/auth-required.e2e-spec.ts` (create if missing)

- [ ] **Step 1: Write failing middleware/controller auth tests**

```ts
describe('Auth-required behavior without guest fallback', () => {
  it('returns 401 for rate-limits usage without bearer token', async () => {
    await request(app.getHttpServer())
      .get('/rate-limits/usage')
      .expect(401);
  });

  it('returns 401 for resume generation without bearer token', async () => {
    await request(app.getHttpServer())
      .post('/resume-tailoring/generate')
      .send({})
      .expect(401);
  });
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run: `npm run test:e2e -- auth-required.e2e-spec.ts`
Expected: FAIL because current code still permits guest fallback/public access.

- [ ] **Step 3: Commit test baseline**

```bash
cd /Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend
git add test/auth-required.e2e-spec.ts
git commit -m "test: add auth-required coverage before guest removal"
```

---

### Task 2: Remove guest identity from backend domain + middleware

**Files:**
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend/src/database/entities/user.entity.ts`
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend/src/modules/user/user.service.ts`
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend/src/shared/middlewares/user-context.middleware.ts`
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend/src/modules/resume-tailoring/services/resume-content.service.ts`
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend/src/modules/ats-match/services/resume-selection.service.ts`
- Test: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend/test/auth-required.e2e-spec.ts`

- [ ] **Step 1: Remove `UserType.GUEST` and guest fields from entity/service context**

```ts
export enum UserPlan {
  FREEMIUM = 'freemium',
  PREMIUM = 'premium',
}

// Remove:
// - UserType enum
// - guest_id field
// - getOrCreateGuestUser/getUserByGuestId methods
```

- [ ] **Step 2: Stop middleware from creating guest context**

```ts
// user-context.middleware.ts
if (!authorizationHeader) {
  req.userContext = null;
  return next();
}

// invalid token should not become guest; leave context null and allow guards to enforce auth
```

- [ ] **Step 3: Remove guest-specific feature checks and use auth/plan checks only**

```ts
// before: return user.userType !== UserType.GUEST
// after: return Boolean(user?.id)
```

- [ ] **Step 4: Run focused backend tests**

Run: `npm run test -- user`
Expected: PASS for updated user/middleware unit coverage.

- [ ] **Step 5: Commit domain cleanup**

```bash
cd /Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend
git add src/database/entities/user.entity.ts src/modules/user/user.service.ts src/shared/middlewares/user-context.middleware.ts src/modules/resume-tailoring/services/resume-content.service.ts src/modules/ats-match/services/resume-selection.service.ts
git commit -m "refactor: remove guest identity model and middleware fallback"
```

---

### Task 3: Enforce authenticated-only API for usage/generation endpoints

**Files:**
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend/src/modules/rate-limit/rate-limit.controller.ts`
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend/src/modules/resume-tailoring/resume-tailoring.controller.ts`
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend/src/app.module.ts` (if middleware skip map needs updates)
- Test: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend/test/auth-required.e2e-spec.ts`

- [ ] **Step 1: Remove `@Public()` on usage and generation endpoints**

```ts
// remove @Public() from:
// - GET /rate-limits/usage
// - POST /resume-tailoring/generate
```

- [ ] **Step 2: Ensure controllers use authenticated user identity only**

```ts
const userId = req.user?.id;
if (!userId) throw new UnauthorizedException('Authentication required');
```

- [ ] **Step 3: Re-run auth-required tests**

Run: `npm run test:e2e -- auth-required.e2e-spec.ts`
Expected: PASS with 401 for unauthenticated calls.

- [ ] **Step 4: Commit endpoint hardening**

```bash
cd /Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend
git add src/modules/rate-limit/rate-limit.controller.ts src/modules/resume-tailoring/resume-tailoring.controller.ts src/app.module.ts test/auth-required.e2e-spec.ts
git commit -m "feat: require auth for usage and generation endpoints"
```

---

### Task 4: Simplify rate limit model to plan-only and user_id-only tracking

**Files:**
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend/src/database/entities/rate-limit-config.entity.ts`
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend/src/modules/rate-limit/rate-limit.service.ts`
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend/src/database/entities/usage-tracking.entity.ts`
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend/src/modules/rate-limit/rate-limit.guard.ts`
- Test: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend/test/rate-limit/*.spec.ts` (existing files)

- [ ] **Step 1: Remove `user_type` dependency from rate-limit config reads**

```ts
// before: where: { plan, userType, featureType }
// after:  where: { plan, featureType }
```

- [ ] **Step 2: Remove guest/ip fallback from usage tracking query keys**

```ts
// before: userId ?? guestId ?? ipAddress
// after:  userId
if (!userId) throw new UnauthorizedException();
```

- [ ] **Step 3: Update seed/init logic to only freemium + premium rows**

```ts
const plans = [UserPlan.FREEMIUM, UserPlan.PREMIUM];
for (const plan of plans) {
  // insert feature limits without user type split
}
```

- [ ] **Step 4: Run rate-limit test suite**

Run: `npm run test -- rate-limit`
Expected: PASS with no guest branches.

- [ ] **Step 5: Commit rate-limit simplification**

```bash
cd /Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend
git add src/database/entities/rate-limit-config.entity.ts src/modules/rate-limit/rate-limit.service.ts src/database/entities/usage-tracking.entity.ts src/modules/rate-limit/rate-limit.guard.ts
git commit -m "refactor: simplify rate limits to authenticated plan-based model"
```

---

### Task 5: Remove `guest_id` from persistence schema and data models

**Files:**
- Create: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend/src/database/migrations/20260406000100-remove-guest-columns-and-enum.ts`
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend/src/database/entities/job-application.entity.ts`
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend/src/database/entities/resume-generations.entity.ts`
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend/src/database/entities/resume-generation-result.entity.ts`
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend/src/database/entities/ats-match-history.entity.ts`
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend/src/modules/job-application/job-application.service.ts`

- [ ] **Step 1: Create migration to drop guest columns/indexes and enum usage**

```ts
await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS guest_id`);
await queryRunner.query(`ALTER TABLE usage_tracking DROP COLUMN IF EXISTS guest_id`);
await queryRunner.query(`ALTER TABLE job_applications DROP COLUMN IF EXISTS guest_id`);
await queryRunner.query(`ALTER TABLE resume_generations DROP COLUMN IF EXISTS guest_id`);
await queryRunner.query(`ALTER TABLE resume_generation_results DROP COLUMN IF EXISTS guest_id`);
await queryRunner.query(`ALTER TABLE ats_match_histories DROP COLUMN IF EXISTS guest_id`);
```

- [ ] **Step 2: Update entities/services to remove `guest_id` references**

```ts
// job ownership is user_id only
where: { user_id: userId }
```

- [ ] **Step 3: Run migration and tests**

Run: `npm run migration:run`
Expected: Migration applies successfully.

Run: `npm run test`
Expected: PASS.

- [ ] **Step 4: Commit schema cleanup**

```bash
cd /Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend
git add src/database/migrations/20260406000100-remove-guest-columns-and-enum.ts src/database/entities/job-application.entity.ts src/database/entities/resume-generations.entity.ts src/database/entities/resume-generation-result.entity.ts src/database/entities/ats-match-history.entity.ts src/modules/job-application/job-application.service.ts
git commit -m "chore: remove guest_id persistence and guest-owned records path"
```

---

### Task 6: Update frontend contracts, guards, and user-facing copy

**Files:**
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-frontend/src/app/core/enums/subscription-type.enum.ts`
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-frontend/src/app/core/models/user/user.model.ts`
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-frontend/src/app/features/apply-new-job/models/job-application.model.ts`
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-frontend/src/app/core/guards/applications-access.guard.ts`
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-frontend/src/app/root/layout/components/header/header.component.ts`
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-frontend/src/app/features/billing/billing.component.ts`
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-frontend/src/app/features/billing/components/overview-tab/overview-tab.component.ts`
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-frontend/src/app/features/authentication/components/signin/signin.component.html`
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-frontend/src/app/features/authentication/components/signup/signup.component.html`
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-frontend/src/app/root/landing/enums/price-card-type.enum.ts`

- [ ] **Step 1: Remove guest from frontend plan/user models**

```ts
export enum SubscriptionType {
  FREEMIUM = 'freemium',
  PREMIUM = 'premium',
}

// remove guestId mapping/field
```

- [ ] **Step 2: Remove `guest_id` API mapping from job application model**

```ts
// remove:
// guestId: application.guest_id ?? ''
```

- [ ] **Step 3: Simplify guards and labels**

```ts
// applications-access.guard.ts
// if authGuard already enforces token + user fetch, remove id-based guest workaround
return true;
```

- [ ] **Step 4: Remove guest copy from auth screens and pricing enums**

```html
<!-- remove "Continue as Guest" and "Try as Guest" CTA blocks -->
```

- [ ] **Step 5: Run frontend tests/lint**

Run: `npm run test -- --watch=false`
Expected: PASS.

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 6: Commit frontend cleanup**

```bash
cd /Users/fahadsubzwari924/Documents/sideProjects/ats-fit-frontend
git add src/app/core/enums/subscription-type.enum.ts src/app/core/models/user/user.model.ts src/app/features/apply-new-job/models/job-application.model.ts src/app/core/guards/applications-access.guard.ts src/app/root/layout/components/header/header.component.ts src/app/features/billing/billing.component.ts src/app/features/billing/components/overview-tab/overview-tab.component.ts src/app/features/authentication/components/signin/signin.component.html src/app/features/authentication/components/signup/signup.component.html src/app/root/landing/enums/price-card-type.enum.ts
git commit -m "refactor: remove guest plan/user paths from frontend"
```

---

### Task 7: Update docs/specs and enforce no remaining guest references

**Files:**
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend/docs/specs/02-auth-and-identity.md`
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend/docs/specs/03-resume-tailoring.md`
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend/docs/specs/06-job-applications.md`
- Modify: `/Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend/docs/specs/08-rate-limits-and-usage.md`

- [ ] **Step 1: Rewrite docs to registered + plan-only model**

```md
- Remove guest onboarding/identity sections
- Document all usage endpoints as authenticated
- Document rate limits keyed by plan + feature only
```

- [ ] **Step 2: Run repo-wide checks for guest remnants**

Run: `rg -n "guest_id|\\bguest\\b|UserType" /Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend/src /Users/fahadsubzwari924/Documents/sideProjects/ats-fit-frontend/src`
Expected: only intentional non-product strings (if any), otherwise no matches in runtime code.

- [ ] **Step 3: Commit docs + cleanup verification**

```bash
cd /Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend
git add docs/specs/02-auth-and-identity.md docs/specs/03-resume-tailoring.md docs/specs/06-job-applications.md docs/specs/08-rate-limits-and-usage.md
git commit -m "docs: align auth and rate-limit specs with no-guest architecture"
```

---

### Task 8: Cross-repo integration verification

**Files:**
- No new files; verification-only task.

- [ ] **Step 1: Start backend and run smoke API checks**

Run: `npm run start:dev`
Expected: service boots with no TypeORM/entity errors.

Run (new terminal): `curl -i http://localhost:3000/rate-limits/usage`
Expected: `401 Unauthorized` without token.

- [ ] **Step 2: Start frontend and run authenticated user flow**

Run: `npm start`
Expected: app builds and serves with no type/template errors.

Manual flow:
1. Login as freemium user.
2. Verify no guest labels in header/billing/auth screens.
3. Trigger rate-limited actions; verify freemium limits.
4. Upgrade/test premium account; verify premium entitlements.

- [ ] **Step 3: Final commit per repo and PR prep**

```bash
cd /Users/fahadsubzwari924/Documents/sideProjects/ats-fit-backend
git status

cd /Users/fahadsubzwari924/Documents/sideProjects/ats-fit-frontend
git status
```

Expected: clean working tree after planned commits.

