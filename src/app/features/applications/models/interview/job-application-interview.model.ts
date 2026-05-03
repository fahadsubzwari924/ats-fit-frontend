import { InterviewStage, InterviewFormat, InterviewOutcome } from '../enums';

/**
 * Frontend model for a job application interview record.
 * Maps snake_case API fields to camelCase properties.
 * Date fields are kept as ISO strings (string | null) — no Date conversion.
 */
export class JobApplicationInterview {
  id: string;
  jobApplicationId: string;

  stage: InterviewStage;
  format: InterviewFormat | null;
  outcome: InterviewOutcome | null;

  scheduledAt: string | null;
  completedAt: string | null;
  durationMinutes: number | null;

  interviewerName: string | null;
  interviewerEmail: string | null;
  locationOrLink: string | null;
  notes: string | null;

  createdAt: string;
  updatedAt: string;

  constructor(data: unknown) {
    const d = data as Record<string, unknown>;

    this.id = d['id'] as string;
    this.jobApplicationId = d['job_application_id'] as string;

    this.stage = d['stage'] as InterviewStage;
    this.format = (d['format'] as InterviewFormat | null | undefined) ?? null;
    this.outcome = (d['outcome'] as InterviewOutcome | null | undefined) ?? null;

    this.scheduledAt = (d['scheduled_at'] as string | null | undefined) ?? null;
    this.completedAt = (d['completed_at'] as string | null | undefined) ?? null;
    this.durationMinutes = (d['duration_minutes'] as number | null | undefined) ?? null;

    this.interviewerName = (d['interviewer_name'] as string | null | undefined) ?? null;
    this.interviewerEmail = (d['interviewer_email'] as string | null | undefined) ?? null;
    this.locationOrLink = (d['location_or_link'] as string | null | undefined) ?? null;
    this.notes = (d['notes'] as string | null | undefined) ?? null;

    this.createdAt = d['created_at'] as string;
    this.updatedAt = d['updated_at'] as string;
  }
}
