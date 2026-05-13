import type { BatchJobError, BatchJobResult } from './batch-tailoring.model';

export type BatchJobState =
  | 'queued'
  | 'analyzing'
  | 'optimizing'
  | 'finalizing'
  | 'completed'
  | 'failed';

export type BatchRunStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'partial'
  | 'failed';

export interface BatchJobLiveState {
  index: number;
  /**
   * Job/row UUID — required to wire the per-job retry endpoint. Sourced from
   * the BE snapshot/SSE envelope; older snapshots that pre-date Task E will
   * leave this `undefined`, in which case the retry button is hidden.
   */
  jobId?: string;
  jobPosition: string;
  companyName: string;
  state: BatchJobState;
  result?: BatchJobResult;
  /**
   * Typed failure envelope when `state === 'failed'`. Replaces the prior
   * plain-string `error` field; the SSE handler hoists the envelope from
   * `JobFailedEvent.error` straight onto this slot, and the snapshot mapper
   * synthesizes a `UNKNOWN/retryable: true` envelope for legacy string rows.
   */
  error?: BatchJobError;
  /** Server-reported manual retry count. Capped at 2 BE-side. */
  retryCount?: number;
}

export interface BatchSnapshot {
  batchId: string;
  totalJobs: number;
  status: BatchRunStatus;
  jobs: BatchJobLiveState[];
}

export interface EnqueueBatchV2Response {
  batchId: string;
  totalJobs: number;
}

export type BatchV2SseEventName =
  | 'snapshot'
  | 'job_started'
  | 'job_progress'
  | 'job_completed'
  | 'job_failed'
  | 'batch_completed'
  | 'heartbeat';
