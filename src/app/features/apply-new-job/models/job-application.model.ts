function parseOptionalDate(raw: unknown): Date {
  if (raw == null || raw === '') {
    return new Date(NaN);
  }
  return new Date(raw as string);
}

export class JobApplication {
  // camelCase properties
  id: string;
  companyName: string;
  jobPosition: string;
  jobDescription: string;
  jobUrl: string;
  jobLocation: string;
  currentSalary: number;
  expectedSalary: number;
  status: string;
  applicationSource: string;
  applicationDeadline: Date;
  appliedAt: Date;
  coverLetter: string;
  notes: string;
  contactPhone: string;
  interviewScheduledAt: Date;
  interviewNotes: string;
  followUpDate: Date;
  rejectionReason: string;
  metadata: JobMetadata;
  createdAt: Date;
  updatedAt: Date;
  userId: string;

  constructor(data: unknown) {
    const d = data as Record<string, unknown>;
    // Convert snake_case to camelCase and handle date conversions
    this.id = d['id'] as string;
    this.companyName = d['company_name'] as string;
    this.jobPosition = d['job_position'] as string;
    this.jobDescription = d['job_description'] as string;
    this.jobUrl = d['job_url'] as string;
    this.jobLocation = d['job_location'] as string;
    this.currentSalary = d['current_salary'] as number;
    this.expectedSalary = d['expected_salary'] as number;
    this.status = d['status'] as string;
    this.applicationSource = d['application_source'] as string;
    this.applicationDeadline = parseOptionalDate(d['application_deadline']);
    this.appliedAt = parseOptionalDate(d['applied_at']);
    this.coverLetter = d['cover_letter'] as string;
    this.notes = d['notes'] as string;
    this.contactPhone = d['contact_phone'] as string;
    this.interviewScheduledAt = parseOptionalDate(d['interview_scheduled_at']);
    this.interviewNotes = d['interview_notes'] as string;
    this.followUpDate = parseOptionalDate(d['follow_up_date']);
    this.rejectionReason = d['rejection_reason'] as string;
    const meta = (d['metadata'] as Record<string, unknown> | undefined) ?? {};
    this.metadata = {
      skillsMatched: meta['skills_matched'] as string[],
      skillsMissing: meta['skills_missing'] as string[]
    };
    this.createdAt = new Date(d['created_at'] as string);
    this.updatedAt = new Date(d['updated_at'] as string);
    this.userId = d['user_id'] as string;
  }
}


// Interface for metadata
export interface JobMetadata {
  skillsMatched: string[];
  skillsMissing: string[];
}
