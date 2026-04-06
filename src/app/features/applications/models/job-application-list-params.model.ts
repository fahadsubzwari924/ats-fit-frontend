/** Matches backend `JobApplicationQueryDto` list query keys. */
export type JobApplicationListSortField =
  | 'created_at'
  | 'updated_at'
  | 'company_name'
  | 'job_position'
  | 'status'
  | 'applied_at'
  | 'application_deadline'
  | 'follow_up_date'
  | 'ats_score';

export interface JobApplicationListParams {
  q?: string;
  /** Sent as a single comma-separated `statuses` query param. */
  statuses?: string[];
  status?: string;
  company_name?: string;
  applied_at_from?: string;
  applied_at_to?: string;
  deadline_from?: string;
  deadline_to?: string;
  follow_up_from?: string;
  follow_up_to?: string;
  limit?: number;
  offset?: number;
  sort_by?: JobApplicationListSortField;
  sort_order?: 'ASC' | 'DESC';
  /** Sent as a single comma-separated `fields` query param. */
  fields?: string[];
}
