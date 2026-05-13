import { Injectable, computed, signal } from '@angular/core';
import type {
  BatchJobLiveState,
  BatchRunStatus,
  BatchSnapshot,
  BatchV2SseEventName,
} from '../models/batch-tailoring-v2.model';
import { normalizeBatchJobError } from '@shared/services/resume.service';

/**
 * Component-scoped state machine for the v2 batch tailoring run.
 *
 * Intentionally NOT `providedIn: 'root'` — each modal/flow gets its own
 * instance so concurrent batches do not bleed signals into one another.
 * Provide it on the consuming component (or its flow controller) via
 * `providers: [BatchTailoringV2State]`.
 */
@Injectable()
export class BatchTailoringV2State {
  private readonly _snapshot = signal<BatchSnapshot | null>(null);
  readonly snapshot = this._snapshot.asReadonly();

  readonly completedCount = computed(
    () => this._snapshot()?.jobs.filter((j) => j.state === 'completed').length ?? 0,
  );
  readonly failedCount = computed(
    () => this._snapshot()?.jobs.filter((j) => j.state === 'failed').length ?? 0,
  );
  readonly totalCount = computed(() => this._snapshot()?.totalJobs ?? 0);

  readonly progressPct = computed(() => {
    const total = this.totalCount();
    if (!total) return 0;
    return Math.round(((this.completedCount() + this.failedCount()) / total) * 100);
  });

  readonly isComplete = computed(() => {
    const s = this._snapshot()?.status;
    return s === 'completed' || s === 'partial' || s === 'failed';
  });

  applySnapshot(snap: BatchSnapshot): void {
    // Normalize raw `error` payloads (envelope OR legacy plain string) onto
    // every failed job before storing the snapshot — downstream surfaces only
    // ever read the canonical `BatchJobError` shape.
    this._snapshot.set({
      ...snap,
      jobs: snap.jobs.map((job) => {
        const normalized = normalizeBatchJobError((job as { error?: unknown }).error);
        return normalized ? { ...job, error: normalized } : { ...job, error: undefined };
      }),
    });
  }

  applyEvent(eventName: BatchV2SseEventName, data: unknown): void {
    if (!this._snapshot()) return;

    switch (eventName) {
      case 'snapshot':
        this.applySnapshot(data as BatchSnapshot);
        break;
      case 'job_started': {
        const e = data as { jobIndex: number };
        this.patchJob(e.jobIndex, { state: 'analyzing' });
        break;
      }
      case 'job_progress': {
        const e = data as { jobIndex: number; stage: BatchJobLiveState['state'] };
        this.patchJob(e.jobIndex, { state: e.stage });
        break;
      }
      case 'job_completed': {
        const e = data as { jobIndex: number; result: BatchJobLiveState['result'] };
        // A successful retry transitions the row back out of `failed` — clear
        // the prior error envelope so the UI re-renders as a success row.
        this.patchJob(e.jobIndex, { state: 'completed', result: e.result, error: undefined });
        break;
      }
      case 'job_failed': {
        // BE now ships `JobFailedEvent.error: BatchJobError` (typed envelope).
        // Legacy/mid-deploy variants may still emit a plain string — the
        // normalizer flattens both shapes onto `BatchJobError`.
        const e = data as { jobIndex: number; error: unknown };
        this.patchJob(e.jobIndex, {
          state: 'failed',
          error: normalizeBatchJobError(e.error),
        });
        break;
      }
      case 'batch_completed': {
        const snap = this._snapshot()!;
        this._snapshot.set({ ...snap, status: this.deriveBatchStatus() });
        break;
      }
      default:
        break;
    }
  }

  private patchJob(index: number, patch: Partial<BatchJobLiveState>): void {
    const snap = this._snapshot();
    if (!snap) return;
    this._snapshot.set({
      ...snap,
      jobs: snap.jobs.map((j) => (j.index === index ? { ...j, ...patch } : j)),
    });
  }

  private deriveBatchStatus(): BatchRunStatus {
    const failed = this.failedCount();
    const completed = this.completedCount();
    const total = this.totalCount();
    if (failed === total) return 'failed';
    if (failed > 0 && completed > 0) return 'partial';
    if (completed === total) return 'completed';
    return 'processing';
  }
}
