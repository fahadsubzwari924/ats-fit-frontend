import { FeatureUsage } from "./feature-usage.model";
import { UploadedResume } from "./uploaded-resumes.model";

export class User {
  fullName!: string;
  email!: string;
  password!: string;
  guestId: string;
  ipAddress: string;
  userAgent: string;
  id: string;
  plan: string;
  userType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  featureUsage: FeatureUsage[];
  uploadedResumes: UploadedResume[];

  constructor(user: any) {
    this.fullName = user?.full_name;
    this.email = user?.email;
    this.password = user?.password;
    this.guestId = user?.guestId;
    this.ipAddress = user?.ipAddress;
    this.userAgent = user?.userAgent;
    this.id = user?.id;
    this.plan = user?.plan;
    this.userType = user?.user_type;
    this.isActive = user?.is_active;
    this.createdAt = user?.created_at;
    this.updatedAt = user?.updated_at;
    this.featureUsage = user?.featureUsage?.map((usage: any) => new FeatureUsage(usage)) || [];
    this.uploadedResumes = user?.uploadedResumes?.map((resume: any) => new UploadedResume(resume)) || [];
  }
}
