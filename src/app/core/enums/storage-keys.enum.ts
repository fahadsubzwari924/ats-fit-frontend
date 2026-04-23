export enum StorageKeys {
  TOKEN = 'token',
  LOGGED_IN = 'loggedIn',
  USER = 'user',
  PROFILE_NUDGE_DISMISSED_AT = 'profileNudgeDismissedAt',
  TAILORING_NUDGE_DISMISSED = 'tailoringNudgeDismissed',
  /** ISO timestamp; post-tailor upgrade banner hidden for 7 days after dismiss. */
  POST_TAILOR_UPGRADE_DISMISSED_AT = 'postTailorUpgradeDismissedAt',
}
