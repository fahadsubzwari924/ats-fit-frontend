import { TailoredResume } from './tailored-resume.model';
import { JobRelevanceResult } from './job-relevance.model';

export type GenerateResumeOutcome =
  | { kind: 'pdf'; resume: TailoredResume }
  | { kind: 'low_fit_warning'; relevance: JobRelevanceResult };
