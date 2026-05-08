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
  replacementInProgress?: boolean;
  lastArchivedExtractId?: string | null;
  quota?: import('@core/models/resume-replacement.model').ReplacementQuota | null;
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

export const ProcessingStatusEnum = {
  NONE: 'none',
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const satisfies Record<string, ProcessingStatus>;

export const TailoringModeEnum = {
  NONE: 'none',
  STANDARD: 'standard',
  ENHANCED: 'enhanced',
  PRECISION: 'precision',
} as const satisfies Record<string, TailoringMode>;
