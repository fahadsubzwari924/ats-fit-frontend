import { ATSScoreDetails } from "@features/ats-scoring/models/ats-match-score.model";

export class AtsMatchHistory {

  id: string;
  userId: string;
  guestId: string;
  resumeContent: string;
  jobPosition: string;
  jobDescription: string;
  companyName: string;
  atsScore: number;
  createdAt: Date;
  analysis: ATSScoreDetails;

  constructor(data: any) {
    this.id = data?.id;
    this.userId = data?.user_id;
    this.guestId = data?.guest_id;
    this.resumeContent = data?.resume_content;
    this.jobPosition = data?.job_position;
    this.jobDescription = data?.job_description;
    this.companyName = data?.company_name;
    this.atsScore = data?.ats_score;
    this.createdAt = data?.created_at;
    this.analysis = new ATSScoreDetails(data?.analysis);
  }
}
