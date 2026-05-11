/**
 * Post-checkout activation constants.
 *
 * Centralizes every user-facing string, timing knob, and link used by
 * `BillingActivationCardComponent` and the activation state-machine inside
 * `BillingComponent`. Keep this file as the single source of truth for the
 * activation copy — never inline strings in the component or template.
 */

/** Discrete states for the post-checkout activation surface. */
export const ACTIVATION_STATE = {
  IDLE: 'idle',
  CONFIRMING: 'confirming',
  PROVISIONING: 'provisioning',
  SUCCESS: 'success',
  TIMEOUT: 'timeout',
} as const;

export type ActivationState = (typeof ACTIVATION_STATE)[keyof typeof ACTIVATION_STATE];

/** Polling cadence + transition thresholds. */
export const POST_CHECKOUT_POLL_CONFIG = {
  /** Delay between `/users/me` polls in milliseconds. */
  INTERVAL_MS: 2000,
  /** Hard cap so polling cannot run forever (covers ngrok latency at 2s × 30 = 60s). */
  MAX_ATTEMPTS: 30,
  /** Elapsed time after which copy flips from "confirming payment" → "setting up account". */
  PROVISIONING_THRESHOLD_MS: 10_000,
  /** How long the success card lingers before auto-returning to the billing tabs. */
  SUCCESS_AUTO_DISMISS_MS: 6_000,
} as const;

/** Headline strings keyed by activation state. */
export const ACTIVATION_HEADLINE: Readonly<Record<ActivationState, string>> = {
  idle: '',
  confirming: 'Activating your Pro plan',
  provisioning: 'Setting up your account',
  success: 'Welcome to Pro',
  timeout: "We're still finalizing your subscription",
};

/** Subheadline strings keyed by activation state. */
export const ACTIVATION_SUBHEAD: Readonly<Record<ActivationState, string>> = {
  idle: '',
  confirming: 'Confirming your payment with our payment provider.',
  provisioning: 'Resetting your monthly quota and unlocking Pro features.',
  success: "You're all set. Here's what's now unlocked on your account.",
  timeout:
    'Your payment went through, but propagation is taking longer than usual. Your plan will update within a few minutes.',
};

/** Secondary helper strings keyed by activation state (empty when not shown). */
export const ACTIVATION_HELPER: Readonly<Record<ActivationState, string>> = {
  idle: '',
  confirming:
    "This usually takes a few seconds. You don't need to refresh — we'll switch you over automatically.",
  provisioning:
    "This usually takes a few seconds. You don't need to refresh — we'll switch you over automatically.",
  success: '',
  timeout: "If this doesn't resolve in a few minutes, contact support and we'll sort it out.",
};

/** CTA / action labels rendered by the activation card. */
export const ACTIVATION_CTA = {
  CONTINUE: 'Continue to your billing',
  REFRESH: 'Refresh page',
  SUPPORT: 'Contact support',
} as const;

/** Pro-plan benefits shown in the success state. */
export const PREMIUM_HIGHLIGHTS: readonly string[] = [
  '30 tailored resumes / month',
  '15 cover letters / month',
  'Batch tailoring (up to 3 resumes per job)',
  'All premium templates',
  'Full generation history',
];

/** ARIA live-region politeness keyed by activation state. */
export const ACTIVATION_ARIA_LIVE: Readonly<Record<ActivationState, 'polite' | 'assertive' | 'off'>> = {
  idle: 'off',
  confirming: 'assertive',
  provisioning: 'assertive',
  success: 'polite',
  timeout: 'assertive',
};

/** Support email contact, formatted as a `mailto:` link with a pre-filled subject. */
export const ACTIVATION_SUPPORT_MAILTO =
  'mailto:support@atsfit.app?subject=Subscription%20activation%20issue';

/**
 * Query-string contract with the LemonSqueezy success redirect. LS appends
 * `?payment=success` (built by `LemonSqueezyService.buildSuccessRedirectUrl`
 * on the backend) when bouncing the user back to `/billing` after checkout.
 * Treat as a wire-protocol constant — must stay in sync with the backend.
 */
export const POST_CHECKOUT_QUERY_PARAM = {
  KEY: 'payment',
  VALUE_SUCCESS: 'success',
} as const;
