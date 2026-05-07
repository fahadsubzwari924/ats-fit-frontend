# Conventions — ats-fit-frontend


## TypeScript

- Enable `strict`; avoid `any`; prefer `unknown` + narrowing
- Explicit return types on exported functions and public class methods
- Use discriminated unions for variant results instead of loose strings
- Prefer `import type` for type-only imports
- Co-locate tests as `*.test.ts` or `__tests__/` per repo standard
- Model domain concepts with types/interfaces, not raw primitives — `UserId` not `string`, `Price` not `number`

### Type, interface, and enum placement

Never define types inline in implementation files. Place them in dedicated files and import:

| What | Where | Filename pattern |
|------|-------|-----------------|
| Domain/business interfaces | `src/domain/` or `features/<name>/` | `<concept>.interface.ts` |
| Shared types across features | `src/types/` | `<concept>.types.ts` |
| Request/response shapes | Next to controller or DTO | `<resource>.dto.ts` or `<resource>.schema.ts` |
| Enums | `src/types/enums/` or `features/<name>/` | `<concept>.enum.ts` |
| Constants (typed) | `src/constants/` | `<domain>.constants.ts` |

One concept per file. If a type is used only within one feature, keep it in that feature folder. If two+ features share it, promote to `src/types/`.











## Node.js backend

### Layer separation (required)

| Layer | Responsibility | What it must NOT do |
|-------|---------------|---------------------|
| Router | Declare route + mount middleware | Business logic, DB calls |
| Controller | Parse request, validate input, call service, return response | Business logic, direct DB access |
| Service | Business logic, orchestration, domain rules | HTTP concepts (req/res), direct DB queries |
| Repository | Data access only (queries, mutations) | Business logic, HTTP concerns |

### Directory structure

Place files by feature first, then by layer responsibility:

```
src/
  features/
    orders/
      orders.router.ts          ← route declarations only
      orders.controller.ts      ← request parsing + validation + service call
      orders.service.ts         ← business logic
      orders.repository.ts      ← DB queries
      orders.interface.ts       ← Order, CreateOrderInput, UpdateOrderInput
      orders.enum.ts            ← OrderStatus, OrderType
      orders.schema.ts          ← Zod/Joi validation schemas
      orders.test.ts
  types/                        ← shared types used by 2+ features
  constants/                    ← named constants grouped by domain
  config/                       ← env vars loaded once
  shared/                       ← utilities that have no feature ownership
```

**Naming rule:** every file name describes its business role, not its technical role. `invoice-fulfillment.service.ts` over `service.ts`; `payment-webhook.controller.ts` over `controller.ts`.

### Constants and configuration

- All magic strings, numbers, and URLs in `src/constants/` (named exports grouped by domain) or `src/config/` (env-driven)
- Example groups: `HTTP_STATUS`, `ERROR_CODES`, `PAGINATION_DEFAULTS`, `RATE_LIMITS`
- Load env vars once in `src/config/env.ts` (or equivalent); never call `process.env` inside business logic

### Input validation (required at controller boundary)

- Validate all incoming data (body, params, query) with a schema library (Zod preferred for TS, Joi for JS) **before** calling the service
- Reject with `400` + structured error when validation fails — never pass unvalidated data to the service layer
- Re-validate within service methods when the method is called from non-HTTP contexts (tests, jobs, etc.)




## Cross-cutting

- One logical change per commit when possible
- Update public docs when behavior visible to users changes

## Consuming Server-Sent Events (SSE)

Use SSE when:
- The server pushes multiple updates over time (progress, live state)
- One-way (server → client) streaming is sufficient
- The operation takes >5s and the user should see incremental progress

Use polling when SSE is unavailable (proxies, CDNs). Use WebSocket only for two-way real-time communication.

### Pattern: `*EventsService` wrapper

Create a dedicated injectable service that wraps `EventSource`:

```typescript
@Injectable({ providedIn: 'root' })
export class MyEventsService {
  readonly connectionStatus = signal<'connecting'|'open'|'reconnecting'|'closed'>('closed');

  open(id: string, accessToken: string): Observable<MyEvent> {
    // 1. Build URL with ?access_token= query param (EventSource cannot send headers)
    // 2. Register named event listeners for each event type
    // 3. Run callbacks inside NgZone.run() to trigger change detection
    // 4. Return Observable — teardown logic closes EventSource
    // 5. Complete subject on terminal event (e.g. batch_completed)
  }
}
```

### Pattern: signals state machine

Use a plain class (not injectable) instantiated per-component:

```typescript
export class MyState {
  private readonly _data = signal<MySnapshot | null>(null);
  readonly data = this._data.asReadonly();
  readonly progress = computed(() => ...);

  applySnapshot(snap: MySnapshot): void { this._data.set(snap); }
  applyEvent(name: EventName, data: unknown): void { /* switch/case */ }
}
```

### Polling fallback

Use an `effect()` in the component to start polling when `connectionStatus() === 'reconnecting'` for >10s:

```typescript
effect(() => {
  if (this.eventsService.connectionStatus() === 'reconnecting') {
    setTimeout(() => {
      if (this.eventsService.connectionStatus() === 'reconnecting') {
        this.startPolling(); // interval(2000).pipe(switchMap(...))
      }
    }, 10_000);
  } else {
    this.stopPolling();
  }
});
```

### Cleanup

Always clean up in `destroyRef.onDestroy()` or `ngOnDestroy()`:

```typescript
this.destroyRef.onDestroy(() => {
  this.sseSub?.unsubscribe();
  this.pollSub?.unsubscribe();
});
```

### Example implementation

See `BatchTailoringV2EventsService` and `BatchTailoringV2State` in `src/app/features/tailor-apply/`.
