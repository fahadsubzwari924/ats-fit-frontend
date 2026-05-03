import { environment } from '@env/environment';

export const API_ROUTES = {
  AUTH: {
    SIGNIN: 'auth/signin',
    SIGNUP: 'auth/signup',
    GOOGLE_LOGIN: 'auth/google/login',
    FORGOT_PASSWORD: 'auth/forgot-password',
    RESET_PASSWORD: 'auth/reset-password',
    VALIDATE_RESET_TOKEN: 'auth/reset-password/validate',
  },
  RESUME: {
    GENERATE: 'resume-tailoring/generate',
    TEMPLATE: 'resume-tailoring/templates',
    HISTORY: 'resume-tailoring/history',
    DOWNLOAD: 'resume-tailoring/download',
    DIFF: 'resume-tailoring/diff',
    COVER_LETTER: 'resume-tailoring/cover-letter',
    BATCH_GENERATE: 'resume-tailoring/batch-generate',
  },
  JOBS: {
    APPLICATIONS: 'job-applications',
    STATS: 'job-applications/stats',
    TAGS: 'job-applications/tags',
    INTERVIEWS: (jobApplicationId: string) =>
      `job-applications/${jobApplicationId}/interviews`,
    INTERVIEW: (jobApplicationId: string, interviewId: string) =>
      `job-applications/${jobApplicationId}/interviews/${interviewId}`,
  },
  USER: {
    ME: 'users/me',
    UPLOAD_RESUME: 'users/upload-resume',
    DELETE_RESUME: 'users/delete-resume',
    FEATURE_USAGE: 'users/feature-usage',
    RESUME_PROFILE_STATUS: 'users/resume-profile-status',
    ONBOARDING_COMPLETE: 'users/onboarding/complete',
  },
  PROFILE: {
    QUESTIONS: 'resume-tailoring/profile-questions',
    ANSWER: 'resume-tailoring/profile-questions/answer',
    COMPLETE: 'resume-tailoring/profile-questions/complete',
  },
  SUBSCRIPTIONS: {
    PLANS: 'subscriptions/plans',
    CHECKOUT: 'subscriptions/checkout',
    USER_SUBSCRIPTION: 'subscriptions/user/subscriptions',
    PAYMENT_HISTORY: 'subscriptions/payment-history',
    CANCEL_SUBSCRIPTION: 'subscriptions',
    // BILLING_INFO: 'subscriptions/billing-info',
  },

  BETA: {
    REDEEM: 'beta/redeem',
    STATUS: 'beta/status',
  },

  createAPIRoute: (api: string) => {
    return `${environment.baseUrl}${api}`;
  },
};
