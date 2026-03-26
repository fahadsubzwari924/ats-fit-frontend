/**
 * Resume profile status from GET /users/resume-profile-status
 */
export type ProcessingStatus =
  | 'none'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed';

export type TailoringMode =
  | 'none'
  | 'standard'
  | 'enhanced'
  | 'precision';

export interface ResumeProfileStatus {
  hasResume: boolean;
  processingStatus: ProcessingStatus;
  questionsTotal: number;
  questionsAnswered: number;
  profileCompleteness: number;
  enrichedProfileId: string | null;
  tailoringMode: TailoringMode;
}

/**
 * Derived UI state for ResumeProfileCard
 */
/** String literal union for profile card state */
export type ProfileState =
  | 'no_resume'
  | 'processing'
  | 'failed'
  | 'questions_pending'
  | 'questions_partial'
  | 'enriching'
  | 'complete';

/** Const map for use in templates (e.g. @switch @case) */
export const ProfileStateEnum = {
  NO_RESUME: 'no_resume',
  PROCESSING: 'processing',
  FAILED: 'failed',
  QUESTIONS_PENDING: 'questions_pending',
  QUESTIONS_PARTIAL: 'questions_partial',
  ENRICHING: 'enriching',
  COMPLETE: 'complete',
} as const satisfies Record<string, ProfileState>;
