import { ApplicationStatus } from '../enums';

export interface IJobApplicationStatusHistoryEntry {
  from: ApplicationStatus | null;
  to: ApplicationStatus;
  changed_at: string;
  changed_by_user_id?: string;
  note?: string;
}
