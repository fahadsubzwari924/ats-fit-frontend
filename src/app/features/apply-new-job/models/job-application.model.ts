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
  atsScore: number;
  atsAnalysis: string;
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
  guestId: string;

  constructor(data: any) {
    // Convert snake_case to camelCase and handle date conversions
    this.id = data?.id;
    this.companyName = data?.company_name;
    this.jobPosition = data?.job_position;
    this.jobDescription = data?.job_description;
    this.jobUrl = data?.job_url;
    this.jobLocation = data?.job_location;
    this.currentSalary = data?.current_salary;
    this.expectedSalary = data?.expected_salary;
    this.status = data?.status;
    this.applicationSource = data?.application_source;
    this.applicationDeadline = parseOptionalDate(data?.application_deadline);
    this.appliedAt = parseOptionalDate(data?.applied_at);
    this.atsScore = data?.ats_score;
    this.atsAnalysis = data?.ats_analysis;
    this.coverLetter = data?.cover_letter;
    this.notes = data?.notes;
    this.contactPhone = data?.contact_phone;
    this.interviewScheduledAt = parseOptionalDate(data?.interview_scheduled_at);
    this.interviewNotes = data?.interview_notes;
    this.followUpDate = parseOptionalDate(data?.follow_up_date);
    this.rejectionReason = data?.rejection_reason;
    this.metadata = {
      skillsMatched: data?.metadata?.skills_matched,
      skillsMissing: data?.metadata?.skills_missing
    };
    this.createdAt = new Date(data?.created_at);
    this.updatedAt = new Date(data?.updated_at);
    this.userId = data?.user_id;
    this.guestId = data?.guest_id;
  }
}


// Interface for metadata
export interface JobMetadata {
  skillsMatched: string[];
  skillsMissing: string[];
}
