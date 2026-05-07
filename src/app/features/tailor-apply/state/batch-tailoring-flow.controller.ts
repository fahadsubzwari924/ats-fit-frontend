import {
  DestroyRef,
  Injectable,
  Signal,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { StorageService } from '@shared/services/storage.service';
import { BatchTailoringV2Service } from '../services/batch-tailoring-v2.service';
import {
  BatchConnectionStatus,
  BatchTailoringV2EventsService,
} from '../services/batch-tailoring-events-v2.service';
import { BatchTailoringV2State } from './batch-tailoring-v2.state';
import type {
  BatchGenerateRequest,
  BatchGenerateResponse,
} from '../models/batch-tailoring.model';
import type { BatchSnapshot } from '../models/batch-tailoring-v2.model';

const POLLING_DELAY_MS = 10_000;
const POLLING_INTERVAL_MS = 2_000;

export type FlowStatus =
  | 'idle'
  | 'enqueueing'
  | 'streaming'
  | 'completed'
  | 'failed';

/**
 * Component-scoped controller that owns the full v2 batch lifecycle:
 * enqueue → SSE stream → polling fallback → terminal transition. Components
 * read its `status`, `state` (snapshot), and `response` (final v1-shaped result)
 * signals; they never touch SSE/polling subscriptions directly.
 */
@Injectable()
export class BatchTailoringFlowController {
  private readonly v2Service = inject(BatchTailoringV2Service);
  private readonly v2Events = inject(BatchTailoringV2EventsService);
  private readonly storage = inject(StorageService);
  private readonly destroyRef = inject(DestroyRef);
  readonly state = inject(BatchTailoringV2State);

  private readonly _status = signal<FlowStatus>('idle');
  readonly status = this._status.asReadonly();

  private readonly _response = signal<BatchGenerateResponse | null>(null);
  readonly response = this._response.asReadonly();

  private readonly _error = signal<string | null>(null);
  readonly error = this._error.asReadonly();

  /**
   * Re-exposed so consumers (e.g. the modal template) do not need to inject
   * `BatchTailoringV2EventsService` directly. `computed` keeps the value
   * reactive without leaking the writable signal.
   */
  readonly connectionStatus: Signal<BatchConnectionStatus> = computed(() =>
    this.v2Events.connectionStatus(),
  );

  private sseSub?: Subscription;
  private pollSub?: Subscription;
  private batchId?: string;
  private currentPayload?: BatchGenerateRequest;

  constructor() {
    // Polling fallback: if SSE stays in 'reconnecting' for >10s, start polling.
    // The cleanup callback fires on every effect re-run AND on destroy.
    effect((onCleanup) => {
      const status = this.v2Events.connectionStatus();
      if (status !== 'reconnecting') {
        this.stopPolling();
        return;
      }
      const timer = setTimeout(() => {
        if (
          this.v2Events.connectionStatus() === 'reconnecting' &&
          this.batchId
        ) {
          this.startPolling();
        }
      }, POLLING_DELAY_MS);
      onCleanup(() => clearTimeout(timer));
    });

    this.destroyRef.onDestroy(() => {
      this.sseSub?.unsubscribe();
      this.stopPolling();
    });
  }

  /** Begin a new batch run. Idempotent: a second call cancels the first. */
  start(payload: BatchGenerateRequest): void {
    this.reset();
    this.currentPayload = payload;
    this._status.set('enqueueing');

    this.v2Service
      .enqueueBatch(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ batchId }) => {
          this.batchId = batchId;
          this._status.set('streaming');
          this.openSse(batchId, payload);
        },
        error: (err: { error?: { message?: string } }) => {
          this._error.set(
            err?.error?.message ??
              'Batch generation failed. Please try again.',
          );
          this._status.set('failed');
        },
      });
  }

  /** Reset to idle (used when the user picks "Tailor Another Set"). */
  reset(): void {
    this.sseSub?.unsubscribe();
    this.stopPolling();
    this.sseSub = undefined;
    this.batchId = undefined;
    this.currentPayload = undefined;
    this._status.set('idle');
    this._response.set(null);
    this._error.set(null);
  }

  private openSse(batchId: string, payload: BatchGenerateRequest): void {
    const token = this.storage.getToken() ?? '';
    this.sseSub = this.v2Events.open(batchId, token).subscribe({
      next: ({ name, data }) => {
        if (name === 'snapshot') {
          const snap = data as BatchSnapshot;
          this.state.applySnapshot(snap);
          if (this.isTerminal(snap.status)) this.transitionToTerminal(payload);
        } else {
          this.state.applyEvent(name, data);
        }
        if (name === 'batch_completed') this.transitionToTerminal(payload);
      },
      error: () => {
        // Polling fallback kicks in via effect()
      },
    });
  }

  private startPolling(): void {
    if (this.pollSub || !this.batchId) return;
    const id = this.batchId;
    this.pollSub = interval(POLLING_INTERVAL_MS)
      .pipe(
        switchMap(() => this.v2Service.getStatus(id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((snap) => {
        this.state.applySnapshot(snap);
        if (this.isTerminal(snap.status) && this.currentPayload) {
          this.transitionToTerminal(this.currentPayload);
        }
      });
  }

  private stopPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = undefined;
  }

  private isTerminal(status: BatchSnapshot['status']): boolean {
    return (
      status === 'completed' || status === 'partial' || status === 'failed'
    );
  }

  /**
   * Idempotent: subsequent calls after the first terminal transition no-op.
   * Without this guard, late SSE events or polling-vs-SSE races re-set
   * `_response` with a new object reference each call, which re-fires every
   * downstream effect (including `notifyFeatureConsumed` which performs a
   * `/users/me` round-trip) and can produce a tight quota-refresh loop.
   */
  private transitionToTerminal(payload: BatchGenerateRequest): void {
    if (this._status() === 'completed') return;
    const snap = this.state.snapshot();
    if (!snap) return;
    this._response.set(this.snapshotToV1Response(snap, payload));
    this._status.set('completed');
    this.sseSub?.unsubscribe();
    this.stopPolling();
  }

  private snapshotToV1Response(
    snap: BatchSnapshot,
    payload: BatchGenerateRequest,
  ): BatchGenerateResponse {
    return {
      batchId: snap.batchId,
      results: snap.jobs.map((j, i) =>
        j.state === 'completed' && j.result
          ? {
              ...j.result,
              status: 'success' as const,
              jobDescription: payload.jobs[i]?.jobDescription ?? '',
            }
          : {
              jobPosition: j.jobPosition,
              companyName: j.companyName,
              status: 'failed' as const,
              error: j.error ?? 'Failed',
              jobDescription: payload.jobs[i]?.jobDescription ?? '',
            },
      ),
      summary: {
        total: snap.totalJobs,
        succeeded: snap.jobs.filter((j) => j.state === 'completed').length,
        failed: snap.jobs.filter((j) => j.state === 'failed').length,
        totalProcessingTimeMs: 0,
      },
    };
  }
}
