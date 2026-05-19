import type { MatchScoreBlock } from '@shared/types/match-score-block.model';

export interface BatchJobInput {
  jobPosition: string;
  companyName: string;
  jobDescription: string;
}

/**
 * Coarse failure-category taxonomy mirrored verbatim from the BE
 * (`src/modules/resume-tailoring/interfaces/batch-job-error.interface.ts`).
 * Each category maps directly to a user-facing copy variant. The FE never
 * synthesizes its own message — it always reads `userMessage` from the
 * envelope below.
 */
export type BatchJobErrorCategory =
  | 'AI_TRUNCATION'
  | 'AI_OVERLOAD'
  | 'AI_PARSING'
  | 'NETWORK'
  | 'UNKNOWN';

/**
 * Canonical batch-job failure envelope. The BE persists this JSON-encoded on
 * `batch_tailoring_jobs.error_message` and emits the same shape on the
 * `job_failed` SSE event + status snapshot DTO. Legacy plain-string rows are
 * synthesized BE-side into `{ category: 'UNKNOWN', retryable: true, ... }` so
 * the FE always sees this shape on a failed result.
 */
export interface BatchJobError {
  category: BatchJobErrorCategory;
  /** Pre-rendered headline + subline joined with a single space — display as-is. */
  userMessage: string;
  /** For logs/ops, never shown in the UI. */
  technicalDetail: string;
  /** `false` only for BadRequest/Forbidden — those rows render without a retry button. */
  retryable: boolean;
  /** ISO-8601 timestamp the failure was classified. */
  occurredAt: string;
}

export interface BatchJobResult {
  /** Job/row UUID — required to wire the per-job retry endpoint. */
  jobId?: string;
  jobPosition: string;
  companyName: string;
  /** Filled client-side from batch input when the API omits it (required for job tracker POST). */
  jobDescription?: string;
  status: 'success' | 'failed';
  resumeGenerationId?: string;
  pdfContent?: string;
  filename?: string;
  optimizationConfidence?: number;
  keywordsAdded?: number;
  sectionsChanged?: number;
  /**
   * Canonical match-score block emitted by the backend. Every batch result item
   * exposes the same `MatchScoreBlock` shape that single tailoring uses. UI
   * surfaces render this directly — never the flat fields below.
   */
  matchScore?: MatchScoreBlock | null;
  /**
   * @deprecated Use `matchScore.before` instead. The backend still emits this
   * flat field for one transition cycle so legacy FE versions don't break
   * mid-deploy. Will be removed once BE v2.3 is stable.
   */
  matchScoreBefore?: number;
  /**
   * @deprecated Use `matchScore.after` instead. Same transition window as
   * `matchScoreBefore` above.
   */
  matchScoreAfter?: number;
  /**
   * Typed failure envelope on failed rows. Read `error.userMessage` for the
   * displayed copy and `error.retryable` to decide whether to render the
   * per-job retry button.
   */
  error?: BatchJobError;
  /**
   * @deprecated Pre-envelope legacy plain-string error field. Kept as an
   * optional second slot only for mid-deploy responses where the BE has not
   * yet rolled out the envelope shape — the service-layer mapper hoists the
   * plain string into `error.userMessage` via a synthesized `UNKNOWN`
   * envelope. New code MUST read `error` only.
   */
  errorMessage?: string;
  /**
   * Server-reported manual retry count for this job. Hard cap is 2 — when the
   * count hits the cap the FE replaces the retry button with a "reached
   * retry limit" hint.
   */
  retryCount?: number;
  blob?: Blob;
}

export interface BatchGenerateRequest {
  jobs: BatchJobInput[];
  templateId: string;
  resumeId?: string;
  /**
   * Mirror of the BE `EnqueueBatchV2Dto.acknowledgeLowFit` flag. Set to
   * `true` after the user explicitly clicks "Tailor anyway" on the low-fit
   * warning step — tells the BE to bypass the per-job low-fit guard and
   * proceed with the batch. Defaults to `false` on first submission.
   */
  acknowledgeLowFit?: boolean;
}

export interface BatchGenerateResponse {
  batchId: string;
  results: BatchJobResult[];
  summary: {
    total: number;
    succeeded: number;
    failed: number;
    totalProcessingTimeMs: number;
  };
}

export type BatchTailoringStep =
  | 'input'
  | 'low_fit_warning'
  | 'processing'
  | 'results';
