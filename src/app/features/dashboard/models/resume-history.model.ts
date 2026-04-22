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
  matchScore: { before: number; after: number; delta: number } | null;
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
    coverageOriginal: number;
    coverageOptimized: number;
    newlyAdded: string[];
    stillMissing: string[];
    targetKeywords: string[];
  };
}
