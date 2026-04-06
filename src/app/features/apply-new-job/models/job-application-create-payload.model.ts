/** POST `/job-applications` body — snake_case per `CreateJobApplicationDto`. */
export interface JobApplicationCreatePayload {
  application_source: 'direct_apply' | 'tailored_resume';
  company_name: string;
  job_position: string;
  job_description: string;
  /** ISO 8601; set when tracking from tailor so Applied date is prefilled in the UI. */
  applied_at?: string;
  job_url?: string;
  resume_generation_id?: string;
}
