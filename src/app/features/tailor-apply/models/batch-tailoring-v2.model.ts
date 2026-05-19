import type { BatchJobError, BatchJobResult } from './batch-tailoring.model';
import type { JobRelevanceResult } from '@features/resume-tailoring/models/job-relevance.model';

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

/**
 * Per-job relevance breakdown returned in the batch low-fit warning payload.
 * Mirrors the BE shape `{ jobIndex, relevance: JobRelevanceResult }` so the
 * FE warning step can render score / verdict / gaps / strengths for every
 * job in the batch (not just the low-scoring ones).
 */
export interface BatchLowFitWarningJob {
  jobIndex: number;
  relevance: JobRelevanceResult;
}

/**
 * Returned by `POST /resume-tailoring/batch/v2/generate` (HTTP 200) when at
 * least one job in the batch scored `verdict === 'low'` AND the caller did
 * not pass `acknowledgeLowFit: true`. The FE detects this via the discriminant
 * `type === 'batch_low_fit_warning'` and shows a confirmation step before
 * re-submitting with `acknowledgeLowFit: true`.
 */
export interface BatchLowFitWarningResponse {
  type: 'batch_low_fit_warning';
  jobs: BatchLowFitWarningJob[];
}

/**
 * Discriminated union for the v2 enqueue endpoint response. Callers MUST
 * narrow via the `type` property OR the presence of `batchId` before
 * accessing fields — otherwise low-fit responses silently produce
 * `batchId === undefined` and SSE opens at `/batch/v2/undefined/events`,
 * which Postgres rejects with `invalid input syntax for type uuid`.
 */
export type EnqueueBatchV2ApiResponse =
  | EnqueueBatchV2Response
  | BatchLowFitWarningResponse;

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
