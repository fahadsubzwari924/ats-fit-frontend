import {
  ApplicationStatus,
  ApplicationSource,
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
  IJobApplicationStatusHistoryEntry,
  IJobApplicationAttachment,
  JobApplicationMetadata,
} from './interfaces';

export type { JobApplicationMetadata };

/**
 * Frontend model for a job application record.
 * Maps snake_case API fields to camelCase properties.
 * Date fields are kept as ISO strings (string | null | undefined) — no Date conversion.
 */
export class JobApplication {
  // ── Identity ─────────────────────────────────────────────────
  id: string;
  userId: string;

  // ── Job details ───────────────────────────────────────────────
  companyName: string;
  jobPosition: string;
  jobDescription: string | null | undefined;
  jobUrl: string | null | undefined;
  jobLocation: string | null | undefined;
  employmentType: EmploymentType | null | undefined;
  workMode: WorkMode | null | undefined;

  // ── Compensation (posted) ─────────────────────────────────────
  salaryMin: number | null | undefined;
  salaryMax: number | null | undefined;
  salaryCurrency: string | null | undefined;
  payPeriod: PayPeriod | null | undefined;
  salaryNegotiable: boolean | null | undefined;

  // ── Pipeline state ────────────────────────────────────────────
  status: ApplicationStatus;
  applicationSource: ApplicationSource;
  jobBoardSource: JobBoardSource | null | undefined;
  appliedVia: AppliedVia | null | undefined;
  priority: ApplicationPriority | null | undefined;
  tags: string[] | null | undefined;
  applicationDeadline: string | null | undefined;
  appliedAt: string | null | undefined;
  decisionDeadline: string | null | undefined;
  followUpDate: string | null | undefined;
  nextAction: string | null | undefined;

  // ── ATS & resume data ─────────────────────────────────────────
  atsScore: number | null | undefined;
  resumeGenerationId: string | null | undefined;
  resumeContent: string | null | undefined;

  // ── Contacts ──────────────────────────────────────────────────
  recruiterName: string | null | undefined;
  recruiterEmail: string | null | undefined;
  recruiterPhone: string | null | undefined;
  hiringManagerName: string | null | undefined;
  hiringManagerEmail: string | null | undefined;
  contactPhone: string | null | undefined;
  contacts: IJobApplicationContact[] | null | undefined;

  // ── Notes & narrative ─────────────────────────────────────────
  coverLetter: string | null | undefined;
  notes: string | null | undefined;

  // ── Interview & follow-up ─────────────────────────────────────
  interviewScheduledAt: string | null | undefined;
  interviewNotes: string | null | undefined;

  // ── Rejection ─────────────────────────────────────────────────
  rejectionStage: RejectionStage | null | undefined;
  rejectionReason: string | null | undefined;
  rejectionFeedbackReceived: boolean | null | undefined;

  // ── Offer ─────────────────────────────────────────────────────
  compensationOffer: IJobApplicationCompensationOffer | null | undefined;

  // ── Attachments / status timeline / metadata ──────────────────
  attachments: IJobApplicationAttachment[] | null | undefined;
  statusHistory: IJobApplicationStatusHistoryEntry[] | null | undefined;
  metadata: JobApplicationMetadata | null | undefined;

  // ── System ────────────────────────────────────────────────────
  createdAt: string;
  updatedAt: string;

  constructor(data: unknown) {
    const d = data as Record<string, unknown>;

    // Identity
    this.id = d['id'] as string;
    this.userId = d['user_id'] as string;

    // Job details
    this.companyName = d['company_name'] as string;
    this.jobPosition = d['job_position'] as string;
    this.jobDescription = (d['job_description'] as string | null | undefined) ?? null;
    this.jobUrl = (d['job_url'] as string | null | undefined) ?? null;
    this.jobLocation = (d['job_location'] as string | null | undefined) ?? null;
    this.employmentType = (d['employment_type'] as EmploymentType | null | undefined) ?? null;
    this.workMode = (d['work_mode'] as WorkMode | null | undefined) ?? null;

    // Compensation (posted)
    this.salaryMin = (d['salary_min'] as number | null | undefined) ?? null;
    this.salaryMax = (d['salary_max'] as number | null | undefined) ?? null;
    this.salaryCurrency = (d['salary_currency'] as string | null | undefined) ?? null;
    this.payPeriod = (d['pay_period'] as PayPeriod | null | undefined) ?? null;
    this.salaryNegotiable = (d['salary_negotiable'] as boolean | null | undefined) ?? null;

    // Pipeline state
    this.status = d['status'] as ApplicationStatus;
    this.applicationSource = d['application_source'] as ApplicationSource;
    this.jobBoardSource = (d['job_board_source'] as JobBoardSource | null | undefined) ?? null;
    this.appliedVia = (d['applied_via'] as AppliedVia | null | undefined) ?? null;
    this.priority = (d['priority'] as ApplicationPriority | null | undefined) ?? null;
    this.tags = (d['tags'] as string[] | null | undefined) ?? null;
    this.applicationDeadline = (d['application_deadline'] as string | null | undefined) ?? null;
    this.appliedAt = (d['applied_at'] as string | null | undefined) ?? null;
    this.decisionDeadline = (d['decision_deadline'] as string | null | undefined) ?? null;
    this.followUpDate = (d['follow_up_date'] as string | null | undefined) ?? null;
    this.nextAction = (d['next_action'] as string | null | undefined) ?? null;

    // ATS & resume data
    this.atsScore = (d['ats_score'] as number | null | undefined) ?? null;
    this.resumeGenerationId = (d['resume_generation_id'] as string | null | undefined) ?? null;
    this.resumeContent = (d['resume_content'] as string | null | undefined) ?? null;

    // Contacts
    this.recruiterName = (d['recruiter_name'] as string | null | undefined) ?? null;
    this.recruiterEmail = (d['recruiter_email'] as string | null | undefined) ?? null;
    this.recruiterPhone = (d['recruiter_phone'] as string | null | undefined) ?? null;
    this.hiringManagerName = (d['hiring_manager_name'] as string | null | undefined) ?? null;
    this.hiringManagerEmail = (d['hiring_manager_email'] as string | null | undefined) ?? null;
    this.contactPhone = (d['contact_phone'] as string | null | undefined) ?? null;
    this.contacts = (d['contacts'] as IJobApplicationContact[] | null | undefined) ?? null;

    // Notes & narrative
    this.coverLetter = (d['cover_letter'] as string | null | undefined) ?? null;
    this.notes = (d['notes'] as string | null | undefined) ?? null;

    // Interview & follow-up
    this.interviewScheduledAt = (d['interview_scheduled_at'] as string | null | undefined) ?? null;
    this.interviewNotes = (d['interview_notes'] as string | null | undefined) ?? null;

    // Rejection
    this.rejectionStage = (d['rejection_stage'] as RejectionStage | null | undefined) ?? null;
    this.rejectionReason = (d['rejection_reason'] as string | null | undefined) ?? null;
    this.rejectionFeedbackReceived = (d['rejection_feedback_received'] as boolean | null | undefined) ?? null;

    // Offer
    this.compensationOffer = (d['compensation_offer'] as IJobApplicationCompensationOffer | null | undefined) ?? null;

    // Attachments / status timeline / metadata
    this.attachments = (d['attachments'] as IJobApplicationAttachment[] | null | undefined) ?? null;
    this.statusHistory = (d['status_history'] as IJobApplicationStatusHistoryEntry[] | null | undefined) ?? null;
    this.metadata = (d['metadata'] as JobApplicationMetadata | null | undefined) ?? null;

    // System
    this.createdAt = d['created_at'] as string;
    this.updatedAt = d['updated_at'] as string;
  }
}
