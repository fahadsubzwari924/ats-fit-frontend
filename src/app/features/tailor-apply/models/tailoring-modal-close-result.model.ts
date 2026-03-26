/**
 * MatDialog close value from tailoring modals.
 * Dashboard refreshes usage/jobs/history only when `refreshDashboard` is true.
 */
export interface TailoringModalCloseResult {
  refreshDashboard?: boolean;
  scrollToQuestions?: boolean;
}
