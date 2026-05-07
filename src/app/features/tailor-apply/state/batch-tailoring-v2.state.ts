import { Injectable, computed, signal } from '@angular/core';
import type {
  BatchJobLiveState,
  BatchRunStatus,
  BatchSnapshot,
  BatchV2SseEventName,
} from '../models/batch-tailoring-v2.model';

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
    this._snapshot.set(snap);
  }

  applyEvent(eventName: BatchV2SseEventName, data: unknown): void {
    if (!this._snapshot()) return;

    switch (eventName) {
      case 'snapshot':
        this._snapshot.set(data as BatchSnapshot);
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
        this.patchJob(e.jobIndex, { state: 'completed', result: e.result });
        break;
      }
      case 'job_failed': {
        const e = data as { jobIndex: number; error: string };
        this.patchJob(e.jobIndex, { state: 'failed', error: e.error });
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
