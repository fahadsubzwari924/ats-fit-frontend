export interface ReplacementQuota {
  used: number;
  limit: number;
  windowStart: string;
  resetsAt: string;
}

export interface ReplaceResumeResponse {
  status: 'queued';
  newResumeId: string;
  newProcessingId: string;
  archivedExtractId: string;
  archivedAt: string; // ISO string — backend Date serialized to JSON
  quota: ReplacementQuota;
}

export interface RestoreArchivedResumeResponse {
  restoredAt: string; // ISO string — backend Date serialized to JSON
}
