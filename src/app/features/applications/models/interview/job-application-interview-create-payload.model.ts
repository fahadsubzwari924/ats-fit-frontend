import { InterviewStage, InterviewFormat, InterviewOutcome } from '../enums';

/**
 * Payload for creating a job application interview.
 * Field names match the backend DTO (snake_case API keys).
 * Only `stage` is required — all other fields are optional.
 */
export interface JobApplicationInterviewCreatePayload {
  stage: InterviewStage;
  format?: InterviewFormat;
  outcome?: InterviewOutcome;
  scheduled_at?: string;
  completed_at?: string;
  duration_minutes?: number;
  interviewer_name?: string;
  interviewer_email?: string;
  location_or_link?: string;
  notes?: string;
}
