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
  /** Set only when verdict === UNAVAILABLE. */
  unavailableReason?: JobRelevanceSkipReason;
}

/** Lightweight summary carried on TailoredResume for the results-step badge. */
export interface PreGenerationFitSummary {
  score: number;
  verdict: JobRelevanceVerdict;
}
