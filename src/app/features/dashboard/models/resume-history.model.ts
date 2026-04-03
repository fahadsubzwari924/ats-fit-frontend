export interface ResumeHistoryItem {
  id: string;
  companyName: string;
  jobPosition: string;
  optimizationConfidence: number | null;
  keywordsAdded: number | null;
  sectionsOptimized: number | null;
  templateId: string | null;
  createdAt: string | Date;
}

export interface ResumeHistoryDetail extends ResumeHistoryItem {
  achievementsQuantified: number | null;
  changesDiff: ResumeDiffSummary | null;
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
  changes: Array<{
    section: string;
    changeType: 'modified' | 'added' | 'removed' | 'unchanged';
    original: string;
    optimized: string;
    addedKeywords: string[];
  }>;
  /** Present only when version === 2 (programmatic diff). */
  keywordAnalysis?: {
    coverageOriginal: number;
    coverageOptimized: number;
    newlyAdded: string[];
    stillMissing: string[];
    targetKeywords: string[];
  };
}
