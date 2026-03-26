export interface CoverLetterContent {
  greeting: string;
  opening: string;
  body: string[];
  closing: string;
  signoff: string;
  candidateName: string;
}

export interface CoverLetterMetadata {
  keyThemesAddressed: string[];
  toneProfile: string;
  wordCount: number;
}

export interface CoverLetterResult {
  coverLetter: CoverLetterContent;
  metadata: CoverLetterMetadata;
}

export interface GenerateCoverLetterRequest {
  resumeGenerationId?: string;
  jobPosition?: string;
  companyName?: string;
  jobDescription?: string;
}
