import {
  ApplicationStatus,
  ApplicationPriority,
  EmploymentType,
  WorkMode,
  JobBoardSource,
  AppliedVia,
  PayPeriod,
  RejectionStage,
} from './enums';
import {
  IJobApplicationContact,
  IJobApplicationCompensationOffer,
  IJobApplicationAttachment,
  JobApplicationMetadata,
} from './interfaces';

/**
 * PUT `/job-applications/:id` body — snake_case keys matching `UpdateJobApplicationDto`.
 * All fields are optional; only send what has changed.
 */
export interface JobApplicationUpdatePayload {
  // ── Core job ──────────────────────────────────────────────────
  company_name?: string;
  job_position?: string;
  job_description?: string;
  job_url?: string;
  job_location?: string;
  employment_type?: EmploymentType;
  work_mode?: WorkMode;

  // ── Compensation (posted) ─────────────────────────────────────
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  pay_period?: PayPeriod;
  salary_negotiable?: boolean;

  // ── Pipeline ──────────────────────────────────────────────────
  status?: ApplicationStatus;
  job_board_source?: JobBoardSource;
  applied_via?: AppliedVia;
  priority?: ApplicationPriority;
  tags?: string[];
  applied_at?: string;
  application_deadline?: string;
  decision_deadline?: string;
  follow_up_date?: string;
  next_action?: string;
  is_archived?: boolean;

  // ── Contacts ──────────────────────────────────────────────────
  recruiter_name?: string;
  recruiter_email?: string;
  recruiter_phone?: string;
  hiring_manager_name?: string;
  hiring_manager_email?: string;
  contact_phone?: string;
  contacts?: IJobApplicationContact[];

  // ── Notes / interview ─────────────────────────────────────────
  cover_letter?: string;
  notes?: string;
  interview_scheduled_at?: string;
  interview_notes?: string;

  // ── Rejection ─────────────────────────────────────────────────
  rejection_stage?: RejectionStage;
  rejection_reason?: string;
  rejection_feedback_received?: boolean;

  // ── Offer ─────────────────────────────────────────────────────
  compensation_offer?: IJobApplicationCompensationOffer;

  // ── Attachments / open metadata ───────────────────────────────
  attachments?: IJobApplicationAttachment[];
  metadata?: JobApplicationMetadata;
}
