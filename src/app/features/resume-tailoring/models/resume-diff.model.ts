// ---------------------------------------------------------------------------
// Shared change type
// ---------------------------------------------------------------------------
export type ChangeType = 'modified' | 'added' | 'removed' | 'unchanged';

// ---------------------------------------------------------------------------
// Legacy format (version < 2, AI-generated)
// ---------------------------------------------------------------------------

export interface SectionDiff {
  section: string;
  changeType: ChangeType;
  original: string;
  optimized: string;
  addedKeywords: string[];
}

export interface ResumeDiff {
  totalChanges: number;
  sectionsChanged: number;
  changes: SectionDiff[];
}

// ---------------------------------------------------------------------------
// Enhanced format (version: 2, programmatically computed)
// ---------------------------------------------------------------------------

export interface BulletDiff {
  changeType: ChangeType;
  original: string;
  optimized: string;
  addedKeywords: string[];
  similarity: number;
}

export interface SkillsCategoryDiff {
  category: string;
  original: string[];
  optimized: string[];
  added: string[];
  removed: string[];
}

export interface ExperienceDiff {
  company: string;
  position: string;
  changeType: ChangeType;
  titleChanged: boolean;
  originalTitle: string;
  optimizedTitle: string;
  bulletChanges: BulletDiff[];
}

export interface KeywordCoverageAnalysis {
  targetKeywords: string[];
  originalMatches: string[];
  newlyAdded: string[];
  stillMissing: string[];
  coverageOriginal: number;
  coverageOptimized: number;
}

export interface EnhancedResumeDiff extends ResumeDiff {
  version: 2;
  computedAt: string;
  summary: {
    changeType: ChangeType;
    original: string;
    optimized: string;
    addedKeywords: string[];
  } | null;
  skills: {
    changeType: ChangeType;
    byCategory: SkillsCategoryDiff[];
    totalAdded: number;
    totalRemoved: number;
  } | null;
  experience: ExperienceDiff[];
  keywordAnalysis: KeywordCoverageAnalysis;
}

/** Type guard: returns true if the diff is the enhanced programmatic format. */
export function isEnhancedDiff(
  diff: ResumeDiff | EnhancedResumeDiff | null,
): diff is EnhancedResumeDiff {
  return diff !== null && (diff as EnhancedResumeDiff).version === 2;
}

// ---------------------------------------------------------------------------
// API response wrapper
// ---------------------------------------------------------------------------

export interface ResumeDiffResponse {
  changesDiff: ResumeDiff | EnhancedResumeDiff | null;
}
