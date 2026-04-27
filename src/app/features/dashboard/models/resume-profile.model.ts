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
  /** Resume parsed but precision questions are not available yet (e.g. none generated, or still standard mode). */
  | 'awaiting_precision_questions'
  | 'complete';

/** Const map for use in templates (e.g. @switch @case) */
export const ProfileStateEnum = {
  NO_RESUME: 'no_resume',
  PROCESSING: 'processing',
  FAILED: 'failed',
  QUESTIONS_PENDING: 'questions_pending',
  QUESTIONS_PARTIAL: 'questions_partial',
  ENRICHING: 'enriching',
  AWAITING_PRECISION_QUESTIONS: 'awaiting_precision_questions',
  COMPLETE: 'complete',
} as const satisfies Record<string, ProfileState>;
