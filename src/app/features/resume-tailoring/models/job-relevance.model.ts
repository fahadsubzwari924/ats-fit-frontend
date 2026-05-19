export enum JobRelevanceVerdict {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  /**
   * Sentinel verdict returned when the backend scoring pipeline could not run
   * (feature flag off, no resume profile, empty profile). The FE detects this
   * via `verdict === UNAVAILABLE` to render a "fit check unavailable" message
   * instead of a misleading score.
   */
  UNAVAILABLE = 'unavailable',
}

/**
 * Mirrors `JobRelevanceSkipReason` on the backend. Surfaced on
 * `JobRelevanceResult.unavailableReason` so the FE can show a targeted
 * message for each cause.
 */
export enum JobRelevanceSkipReason {
  FEATURE_DISABLED = 'feature_disabled',
  NO_PROFILE = 'no_profile',
  EMPTY_PROFILE = 'empty_profile',
  /**
   * The user has consumed all their JOB_RELEVANCE_SCORE quota for the
   * current monthly period. The standalone /relevance endpoint returns
   * 403 (handled in the HTTP error path); the orchestrator-internal call
   * returns the UNAVAILABLE sentinel with this reason so the tailor
   * modal can skip the Job Fit step gracefully and proceed to Template.
   */
  QUOTA_EXHAUSTED = 'quota_exhausted',
}

/**
 * Mirrors `JobRelevanceEngine` on the backend. Surfaced on
 * `JobRelevanceResult.engine` so the FE can tell whether a relevance call
 * actually burned quota (only `LLM` does — cache hits + fast-path skips
 * cost nothing and the BE skips `recordUsage` for them).
 */
export enum JobRelevanceEngine {
  LLM = 'llm',
  CACHE_HIT = 'cache-hit',
  KEYWORD_FAST_PATH = 'keyword-fast-path',
  FALLBACK = 'fallback',
  TIMEOUT = 'timeout',
  SKIPPED = 'skipped',
}

export enum JobRelevanceDimensionLabel {
  MISMATCH = 'Mismatch',
  PARTIAL = 'Partial',
  ALIGNED = 'Aligned',
}

export interface JobRelevanceDimension {
  score: number;
  label: JobRelevanceDimensionLabel;
}

export interface JobRelevanceDimensions {
  techStack: JobRelevanceDimension;
  roleType: JobRelevanceDimension;
  experienceLevel: JobRelevanceDimension;
}

export interface JobRelevanceResult {
  score: number;
  verdict: JobRelevanceVerdict;
  dimensions: JobRelevanceDimensions;
  gaps: string[];
  strengths: string[];
  /**
   * Which path produced this result. Used by the modal to decide whether to
   * decrement the local quota cache: only `LLM` burns a unit — cache hits +
   * fast-path skips don't consume quota.
   */
  engine?: JobRelevanceEngine;
  /** Set only when verdict === UNAVAILABLE. */
  unavailableReason?: JobRelevanceSkipReason;
}

/** Lightweight summary carried on TailoredResume for the results-step badge. */
export interface PreGenerationFitSummary {
  score: number;
  verdict: JobRelevanceVerdict;
}
