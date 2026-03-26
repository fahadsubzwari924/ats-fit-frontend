/**
 * Single profile question (from API or with local state)
 */
export interface ProfileQuestion {
  id: string;
  workExperienceIndex: number;
  bulletPointIndex: number;
  originalBulletPoint: string;
  questionText: string;
  questionCategory: string;
  userResponse: string | null;
  isAnswered: boolean;
  orderIndex: number;
  /** Set when user skips (response: null) - question no longer shown as pending */
  isSkipped?: boolean;
}

/**
 * Employer-grouped questions for display (company name, title, dates may come from extracted content or API)
 */
export interface EmployerQuestionGroup {
  workExperienceIndex: number;
  companyName: string;
  jobTitle: string;
  startDate?: string;
  endDate?: string;
  questions: ProfileQuestion[];
}

/**
 * Payload for POST /resume-tailoring/profile-questions/answer
 */
export interface AnswerPayload {
  questionId: string;
  response: string | null;
}
