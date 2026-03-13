import { environment } from '@env/environment';

export const API_ROUTES = {
  AUTH: {
    SIGNIN: 'auth/signin',
    SIGNUP: 'auth/signup',
    GOOGLE_LOGIN: 'auth/google/login',
  },
  RESUME: {
    GENERATE: 'resume-tailoring/generate',
    TEMPLATE: 'resume-tailoring/templates',
    ATS_MATCH_SCORE: 'ats-match/score',
    ATS_MATCH_HISTORY: 'ats-match/history',
  },
  JOBS: {
    APPLICATIONS: 'job-applications',
    STATS: 'job-applications/stats',
  },
  USER: {
    UPLOAD_RESUME: 'users/upload-resume',
    DELETE_RESUME: 'users/delete-resume',
    FEATURE_USAGE: 'users/feature-usage',
  },
  SUBSCRIPTIONS: {
    PLANS: 'subscriptions/plans',
    CHECKOUT: 'subscriptions/checkout',
    USER_SUBSCRIPTION: 'subscriptions/user/subscriptions',
    PAYMENT_HISTORY: 'subscriptions/payment-history',
    // CANCEL_SUBSCRIPTION: 'subscriptions/cancel',
    // BILLING_INFO: 'subscriptions/billing-info',
  },

  createAPIRoute: (api: string) => {
    return `${environment.baseUrl}${api}`;
  },
};
