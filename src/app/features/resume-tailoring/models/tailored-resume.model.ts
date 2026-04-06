import { TailoringMode } from '@features/dashboard/models/resume-profile.model';

export class TailoredResume {
  public blob: Blob;
  public filename: string;
  public resumeGenerationId: string;
  public tailoringMode: TailoringMode;
  public keywordsAdded: number;
  public sectionsOptimized: number;
  public achievementsQuantified: number;
  public optimizationConfidence: number;

  constructor(data: {
    blob: Blob;
    filename?: string;
    resumeGenerationId?: string;
    tailoringMode?: TailoringMode;
    keywordsAdded?: number;
    sectionsOptimized?: number;
    achievementsQuantified?: number;
    optimizationConfidence?: number;
  }) {
    this.blob = data?.blob;
    this.filename = data?.filename ?? '';
    this.resumeGenerationId = data?.resumeGenerationId ?? '';
    this.tailoringMode = data?.tailoringMode ?? 'standard';
    this.keywordsAdded = data?.keywordsAdded ?? 0;
    this.sectionsOptimized = data?.sectionsOptimized ?? 0;
    this.achievementsQuantified = data?.achievementsQuantified ?? 0;
    this.optimizationConfidence = data?.optimizationConfidence ?? 0;
  }
}
