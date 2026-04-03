import { SubscriptionType } from '@core/enums/subscription-type.enum';
import { FeatureUsage } from './feature-usage.model';
import { UploadedResume } from './uploaded-resumes.model';

export class User {
  fullName!: string;
  email!: string;
  password!: string;
  guestId: string;
  ipAddress: string;
  userAgent: string;
  id: string;
  plan: string;
  /** Derived from `plan` — use instead of comparing `plan` to `SubscriptionType` in templates. */
  isPremium: boolean;
  /** Derived from `plan` — freemium-only UI (not the same as `!isPremium` when plan is `guest`). */
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
  constructor(user: any) {
    this.fullName = user?.full_name ?? user?.fullName ?? '';
    this.email = user?.email ?? '';
    this.password = user?.password ?? '';
    this.guestId = user?.guestId ?? '';
    this.ipAddress = user?.ipAddress ?? '';
    this.userAgent = user?.userAgent ?? '';
    this.id = user?.id ?? '';
    this.plan = user?.plan ?? '';
    this.isPremium = this.plan === SubscriptionType.PREMIUM;
    this.isFreemium = this.plan === SubscriptionType.FREEMIUM;
    this.userType = user?.user_type ?? user?.userType ?? '';
    this.isActive = user?.is_active ?? user?.isActive ?? false;
    this.createdAt = user?.created_at ?? user?.createdAt ?? '';
    this.updatedAt = user?.updated_at ?? user?.updatedAt ?? '';
    this.onboardingCompleted =
      user?.onboarding_completed ?? user?.onboardingCompleted ?? true;

    const usageList = user?.featureUsage ?? user?.feature_usage;
    this.featureUsage = Array.isArray(usageList)
      ? usageList.map((usage: any) => new FeatureUsage(usage))
      : [];

    const resumeList = user?.uploadedResumes ?? user?.uploaded_resumes;
    this.uploadedResumes = Array.isArray(resumeList)
      ? resumeList.map((resume: any) => new UploadedResume(resume))
      : [];
  }
}
