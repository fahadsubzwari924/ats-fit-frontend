export enum Messages {
  PLEASE_UPLOAD_A_PDF_FILE = 'Please upload a PDF file.',
  PLEASE_UPLOAD_A_RESUME_FILE = 'Please upload a resume file.',
  PLEASE_ADD_A_JOB_DESCRIPTION = 'Please add a job description.',
  RESUME_UPLOADED_SUCCESSFULLY = 'Resume uploaded successfully.',
  ERROR_UPLOADING_RESUME = 'Error in uploading resume',
  CLOSE = 'Close',
  SIGNUP_SUCCESS = 'Signup successful!',
  SIGNUP_FAILED = 'Signup failed. Please try again.',

  LOGIN_FAILED = 'Login failed. Please try again.',
  NO_RESUME_AVAILABLE = 'No resume available for download.',

  UPLOAD_FAILED_PLEASE_TRY_AGAIN = 'Upload failed. Please try again.',

  YOU_NEED_TO_LOGIN_MESSAGE = 'You need to be logged in to access this page.',

  JOB_STATUS_UPDATED_SUCCESSFULLY = 'Job status updated successfully.',

  RESUME_IS_NOT_VALID = 'Resume is not valid',

  GOOGLE_AUTH_FAILED = 'Google authentication failed',
  FORGOT_PASSWORD_SUCCESS = 'Check your inbox — a reset link is on its way.',
  RESET_PASSWORD_SUCCESS = 'Password updated! You can now sign in with your new password.',
  RESET_PASSWORD_FAILED = 'This reset link is invalid or has expired. Please request a new one.',
  FORGOT_PASSWORD_FAILED = 'Something went wrong. Please try again.',

  // Job-relevance "unavailable" sentinel messages — keyed by JobRelevanceSkipReason.
  // Resolved in modal via mapJobFitUnavailableMessage() so each cause has a
  // targeted CTA (upload, re-upload, try later) instead of a generic toast.
  JOB_FIT_UNAVAILABLE_NO_PROFILE = 'Add a resume to your profile first so we can score how well it fits this role.',
  JOB_FIT_UNAVAILABLE_EMPTY_PROFILE = 'Your resume profile looks empty. Please re-upload your resume to enable the fit check.',
  JOB_FIT_UNAVAILABLE_FEATURE_DISABLED = 'Job fit check is temporarily unavailable. Please try again later.',
  JOB_FIT_UNAVAILABLE_QUOTA_EXHAUSTED = "You've used all your job-fit checks this month. We'll skip the fit preview — tailoring still works, and your fit checks reset next month.",
  JOB_FIT_UNAVAILABLE_DEFAULT = 'Job fit check is unavailable for your profile right now.',
}
