/**
 * PUT `/job-applications/:id` body — snake_case keys as accepted by the API.
 * Additional properties are allowed for full updates.
 */
export type JobApplicationUpdatePayload = Record<string, unknown> & {
  status?: string;
  applied_at?: string;
  interview_scheduled_at?: string;
  interview_notes?: string;
  follow_up_date?: string;
  notes?: string;
  rejection_reason?: string;
  contact_phone?: string;
};
