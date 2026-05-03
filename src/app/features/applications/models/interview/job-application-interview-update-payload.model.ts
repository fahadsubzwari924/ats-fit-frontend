import { InterviewStage, InterviewFormat, InterviewOutcome } from '../enums';

/**
 * Payload for updating a job application interview.
 * All fields are optional — send only the fields to patch.
 * Field names match the backend DTO (snake_case API keys).
 */
export interface JobApplicationInterviewUpdatePayload {
  stage?: InterviewStage;
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
