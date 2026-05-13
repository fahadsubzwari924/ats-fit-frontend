import type { MatchScoreBlock } from '@shared/types/match-score-block.model';

export interface ResumeHistoryItem {
  id: string;
  companyName: string;
  jobPosition: string;
  /** @deprecated Use matchScore instead */
  optimizationConfidence: number | null;
  keywordsAdded: number | null;
  sectionsOptimized: number | null;
  templateId: string | null;
  createdAt: string | Date;
  canDownload: boolean;
  hasCoverLetter: boolean;
  matchScore: MatchScoreBlock | null;
  atsChecks: { passed: number; total: number } | null;
}

export interface ResumeHistoryDetail extends ResumeHistoryItem {
  achievementsQuantified: number | null;
  changesDiff: ResumeDiffSummary | null;
  bulletsQuantified: { before: number; after: number; total: number } | null;
}

export interface PaginatedHistoryResponse {
  items: ResumeHistoryItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ResumeDiffSummary {
  version?: number;
  totalChanges: number;
  sectionsChanged: number;
  changes: {
    section: string;
    changeType: 'modified' | 'added' | 'removed' | 'unchanged';
    original: string;
    optimized: string;
    addedKeywords: string[];
  }[];
  /** Present only when version === 2 (programmatic diff). */
  keywordAnalysis?: {
    /**
     * @deprecated Use the canonical `matchScore` block on the parent
     * `ResumeHistoryItem` (or `ResumeHistoryDetail`) instead. The backend
     * still emits this field for keyword-list rendering, but its numeric
     * value is no longer the source of truth for match scoring — that lives
     * on `matchScore.before`.
     */
    coverageOriginal: number;
    /**
     * @deprecated Use the canonical `matchScore` block instead. Same
     * rationale as `coverageOriginal` above — the numbers here may diverge
     * from the headline score since they predate the unified scorer.
     */
    coverageOptimized: number;
    newlyAdded: string[];
    stillMissing: string[];
    targetKeywords: string[];
  };
}
