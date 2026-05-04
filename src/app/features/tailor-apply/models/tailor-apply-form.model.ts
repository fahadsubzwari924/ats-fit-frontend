import { TailoredResume } from '@features/resume-tailoring/models/tailored-resume.model';

export type TailorApplyStep = 1 | 2 | 3;

export interface TailorApplyFormValues {
  jobPosition: string;
  companyName: string;
  jobDescription: string;
  selectedTemplate: string;
}

export interface TailorApplyResult {
  tailoredResume: TailoredResume;
  jobTracked: boolean;
}
