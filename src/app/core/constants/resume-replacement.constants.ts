export const RESUME_REPLACEMENT_COPY = {
  modal: {
    title: 'Replace Resume',
    introLine: "Replacing your resume restarts profile setup. Here's what happens:",
    bullets: [
      { icon: 'check', text: 'Past tailored resumes stay accessible' },
      { icon: 'check', text: 'ATS scores + job applications preserved' },
      { icon: 'refresh', text: 'New work-experience questions generated' },
      { icon: 'refresh', text: 'Tailoring locked for ~2 minutes' },
    ] as { icon: string; text: string }[],
    answersWarning: (count: number) =>
      `Your ${count} previous answers will be archived`,
    quotaLine: (used: number, total: number, resetsAt: string) =>
      `Quota: ${used} of ${total} replacements used this period. Resets ${resetsAt}.`,
    fileDropHint: 'PDF only, max 5 MB',
    cta: 'Replace resume',
    cancel: 'Cancel',
    sameFileMessage: "That's the same file you already have.",
  },
  upgradeDialog: {
    title: 'Resume replacement is a Pro feature',
    body: 'Upgrade to Pro to replace your resume up to 3 times per month.',
    cta: 'View plans',
    cancel: 'Not now',
  },
  banner: {
    replacementProcessing: 'Your new resume is being read...',
    replacementFailed: 'Resume replacement failed.',
    tryAgain: 'Try again',
    restorePrevious: 'Restore previous',
    restoreSuccess: 'Previous resume restored.',
    restoreError: 'Could not restore. Try again.',
  },
  card: {
    replaceButton: 'Replace resume',
  },
  toast: {
    submitted: 'Resume replacement started. Your new profile will be ready shortly.',
    quotaExceeded: (resetsAt: string) => `Quota exceeded. Resets on ${resetsAt}.`,
    storageFailed: 'File upload failed. Please try again.',
    txFailed: 'Replacement failed. Please try again.',
    profileNotReady: 'Your resume is still processing. Please wait and try again.',
    enrichmentInProgress: 'Profile enrichment is in progress. Please try again shortly.',
    noActiveResume: 'No active resume found. Please upload a resume first.',
    upgradeRequired: 'This feature requires a premium plan.',
  },
  state: {
    replacement: {
      enrichingTitle: 'Rebuilding Your Precision Profile',
      enrichingSubtitle: 'Merging your new resume with your previous answers — this takes a few seconds.',
      completeToast: 'Your new resume profile is ready. Precision tailoring is active.',
    },
    initial: {
      enrichingTitle: 'Building Your Precision Profile',
      enrichingSubtitle: 'Merging your answers with your resume — this takes a few seconds.',
    },
  },
} as const;

export const RESUME_REPLACEMENT_LIMITS = {
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024,
  ALLOWED_MIME_TYPES: ['application/pdf'] as const,
} as const;
