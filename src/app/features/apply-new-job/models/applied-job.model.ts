import { JobApplication } from "./job-application.model";

export class AppliedJob {
  applications: JobApplication[];
  count: number;
  limit: number;
  offset: number;
  total: number;

  constructor(data: unknown) {
    const d = data as Record<string, unknown>;
    const rows = d['applications'];
    this.applications = Array.isArray(rows)
      ? rows.map((item: unknown) => new JobApplication(item))
      : [];
    this.count = d['count'] as number;
    this.limit = d['limit'] as number;
    this.offset = d['offset'] as number;
    this.total = d['total'] as number;
  }
}
