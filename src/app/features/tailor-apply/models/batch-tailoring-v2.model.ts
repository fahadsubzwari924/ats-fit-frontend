import type { BatchJobResult } from './batch-tailoring.model';

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
  jobPosition: string;
  companyName: string;
  state: BatchJobState;
  result?: BatchJobResult;
  error?: string;
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
