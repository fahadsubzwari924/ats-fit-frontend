export enum JobRelevanceVerdict {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
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
}

/** Lightweight summary carried on TailoredResume for the results-step badge. */
export interface PreGenerationFitSummary {
  score: number;
  verdict: JobRelevanceVerdict;
}
