export type UserTier =
  | 'freemium'
  | 'beta_active'
  | 'beta_expiring_soon'
  | 'premium_paid';

export const BETA_EXPIRING_SOON_THRESHOLD_DAYS = 7;
