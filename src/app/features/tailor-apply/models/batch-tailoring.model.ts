import type { MatchScoreBlock } from '@shared/types/match-score-block.model';

export interface BatchJobInput {
  jobPosition: string;
  companyName: string;
  jobDescription: string;
}

export interface BatchJobResult {
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
  error?: string;
  blob?: Blob;
}

export interface BatchGenerateRequest {
  jobs: BatchJobInput[];
  templateId: string;
  resumeId?: string;
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

export type BatchTailoringStep = 'input' | 'processing' | 'results';
