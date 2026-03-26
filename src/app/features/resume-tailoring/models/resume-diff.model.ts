export type ChangeType = 'modified' | 'added' | 'removed' | 'unchanged';

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

export interface ResumeDiffResponse {
  changesDiff: ResumeDiff | null;
}
