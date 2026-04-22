import { SubscriptionType } from '@core/enums/subscription-type.enum';
import { FeatureUsage } from './feature-usage.model';
import { UploadedResume } from './uploaded-resumes.model';

export class User {
  fullName!: string;
  email!: string;
  password!: string;
  ipAddress: string;
  userAgent: string;
  id: string;
  plan: string;
  /** Derived from `plan` — use instead of comparing `plan` to `SubscriptionType` in templates. */
  isPremium: boolean;
  /** Derived from `plan` — freemium tier (non-premium). */
  isFreemium: boolean;
  userType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  onboardingCompleted: boolean;
  featureUsage: FeatureUsage[];
  uploadedResumes: UploadedResume[];

  /**
   * Supports both API payloads (snake_case) and JSON persisted from the client (camelCase).
   * localStorage stores the result of `JSON.stringify(user)` after login, so reload must read `fullName`, etc.
   */
  constructor(user: unknown) {
    const u = user as Record<string, unknown>;
    this.fullName = (u['full_name'] ?? u['fullName'] ?? '') as string;
    this.email = (u['email'] ?? '') as string;
    this.password = (u['password'] ?? '') as string;
    this.ipAddress = (u['ipAddress'] ?? '') as string;
    this.userAgent = (u['userAgent'] ?? '') as string;
    this.id = (u['id'] ?? '') as string;
    this.plan = (u['plan'] ?? '') as string;
    this.isPremium = this.plan === SubscriptionType.PREMIUM;
    this.isFreemium = this.plan === SubscriptionType.FREEMIUM;
    this.userType = (u['user_type'] ?? u['userType'] ?? '') as string;
    this.isActive = (u['is_active'] ?? u['isActive'] ?? false) as boolean;
    this.createdAt = (u['created_at'] ?? u['createdAt'] ?? '') as string;
    this.updatedAt = (u['updated_at'] ?? u['updatedAt'] ?? '') as string;
    this.onboardingCompleted =
      (u['onboarding_completed'] ?? u['onboardingCompleted'] ?? true) as boolean;

    const usageList = u['featureUsage'] ?? u['feature_usage'];
    this.featureUsage = Array.isArray(usageList)
      ? usageList.map((usage: Record<string, unknown>) => new FeatureUsage(usage))
      : [];

    const resumeList = u['uploadedResumes'] ?? u['uploaded_resumes'];
    this.uploadedResumes = Array.isArray(resumeList)
      ? resumeList.map((resume: Record<string, unknown>) => new UploadedResume(resume))
      : [];
  }
}
