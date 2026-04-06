import { ApplicationStatus } from '@features/dashboard/enums/application-status.enum';

/** Active pipeline — still in motion. */
export const APPLICATION_PIPELINE_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.APPLIED,
  ApplicationStatus.SCREENING,
  ApplicationStatus.TECHNICAL_ROUND,
  ApplicationStatus.INTERVIEWED,
  ApplicationStatus.OFFER_RECEIVED,
];

/** Resolved / terminal outcomes. */
export const APPLICATION_OUTCOME_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.ACCEPTED,
  ApplicationStatus.REJECTED,
  ApplicationStatus.WITHDRAWN,
];
