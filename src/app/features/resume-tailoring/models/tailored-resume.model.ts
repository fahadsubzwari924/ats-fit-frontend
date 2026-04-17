import { TailoringMode } from '@features/dashboard/models/resume-profile.model';

export class TailoredResume {
  public blob: Blob;
  public filename: string;
  public resumeGenerationId: string;
  public tailoringMode: TailoringMode;
  public keywordsAdded: number;
  public sectionsOptimized: number;
  public achievementsQuantified: number;
  /** @deprecated Always null — use matchScore instead */
  public optimizationConfidence: number | null;
  public matchScore: { before: number; after: number; delta: number } | null;
  public atsChecks: { passed: number; total: number } | null;
  public bulletsQuantified: { before: number; after: number; total: number } | null;

  constructor(data: {
    blob: Blob;
    filename?: string;
    resumeGenerationId?: string;
    tailoringMode?: TailoringMode;
    keywordsAdded?: number;
    sectionsOptimized?: number;
    achievementsQuantified?: number;
    optimizationConfidence?: number | null;
    matchScore?: { before: number; after: number; delta: number } | null;
    atsChecks?: { passed: number; total: number } | null;
    bulletsQuantified?: { before: number; after: number; total: number } | null;
  }) {
    this.blob = data?.blob;
    this.filename = data?.filename ?? '';
    this.resumeGenerationId = data?.resumeGenerationId ?? '';
    this.tailoringMode = data?.tailoringMode ?? 'standard';
    this.keywordsAdded = data?.keywordsAdded ?? 0;
    this.sectionsOptimized = data?.sectionsOptimized ?? 0;
    this.achievementsQuantified = data?.achievementsQuantified ?? 0;
    this.optimizationConfidence = null;
    this.matchScore = data?.matchScore ?? null;
    this.atsChecks = data?.atsChecks ?? null;
    this.bulletsQuantified = data?.bulletsQuantified ?? null;
  }
}
