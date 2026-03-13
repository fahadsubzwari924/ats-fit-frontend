import { JobApplication } from "./job-application.model";

export class AppliedJob {
  applications: JobApplication[];
  count: number;
  limit: number;
  offset: number;
  total: number;

  constructor(data: any) {
    this.applications = (data?.applications || []).map((item: any) => new JobApplication(item));
    this.count = data?.count;
    this.limit = data?.limit;
    this.offset = data?.offset;
    this.total = data?.total;
  }
}
