import {
  ApplicationStatus,
  ApplicationSource,
  ApplicationPriority,
  EmploymentType,
  WorkMode,
  JobBoardSource,
  AppliedVia,
  PayPeriod,
} from './enums';
import {
  IJobApplicationContact,
  IJobApplicationAttachment,
  JobApplicationMetadata,
} from './interfaces';

/**
 * POST `/job-applications` body — snake_case keys matching `CreateJobApplicationDto`.
 * `company_name` and `job_position` are required; everything else is optional.
 */
export interface JobApplicationCreatePayload {
  // ── Required ──────────────────────────────────────────────────
  company_name: string;
  job_position: string;

  // ── Application source (required by DTO, but defaultable) ─────
  application_source?: ApplicationSource;

  // ── Status ────────────────────────────────────────────────────
  status?: ApplicationStatus;

  // ── Job details ───────────────────────────────────────────────
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
  job_board_source?: JobBoardSource;
  applied_via?: AppliedVia;
  priority?: ApplicationPriority;
  tags?: string[];
  applied_at?: string;
  application_deadline?: string;
  decision_deadline?: string;
  next_action?: string;

  // ── Resume data ───────────────────────────────────────────────
  resume_generation_id?: string;
  resume_content?: string;

  // ── Contacts ──────────────────────────────────────────────────
  recruiter_name?: string;
  recruiter_email?: string;
  recruiter_phone?: string;
  hiring_manager_name?: string;
  hiring_manager_email?: string;
  contact_phone?: string;
  contacts?: IJobApplicationContact[];

  // ── Notes & narrative ─────────────────────────────────────────
  cover_letter?: string;
  notes?: string;

  // ── Attachments / open metadata ───────────────────────────────
  attachments?: IJobApplicationAttachment[];
  metadata?: JobApplicationMetadata;
}
