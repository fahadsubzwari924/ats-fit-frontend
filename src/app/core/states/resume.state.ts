import { computed, Injectable, signal, inject } from '@angular/core';
import { ATSMatchScore } from '@features/ats-scoring/models/ats-match-score.model';
import { TailoredResume } from '@features/resume-tailoring/models/tailored-resume.model';
import { ATSRequestForm } from '@features/ats-scoring/types/ats-request-form.type';
import { ResumeService } from '@shared/services/resume.service';
import { FeatureUsage } from '@core/models/user/feature-usage.model';

@Injectable({
  providedIn: 'root',
})
export class ResumeState {
  private resumeService = inject(ResumeService);

  private _atsMatchScore = signal<ATSMatchScore | null>(null);
  private _tailoredResume = signal<TailoredResume | null>(null);
  private _newJobAtsFormValues = signal<ATSRequestForm | null>(null);

  /**
   * Templates are now managed by ResumeService with caching
   * This computed signal provides backward compatibility for components still using state
   */
  public readonly templates = computed(
    () => this.resumeService.availableTemplates() ?? []
  );

  /**
   * TODO: Future Improvements
   * - Need to remove "_resumeFile" and "resumeFile" line after resume selection handled on BE
   */
  private _resumeFile = signal<File | null>(null);
  public readonly resumeFile = this._resumeFile.asReadonly();

  public readonly atsMatchScore = this._atsMatchScore.asReadonly();
  public readonly newJobAtsFormValues = this._newJobAtsFormValues.asReadonly();
  public readonly tailoredResume = this._tailoredResume.asReadonly();

  public setAtsMatchScore(response: ATSMatchScore): void {
    this._atsMatchScore.set(response);
  }

  public setNewJobAtsFormValues(values: ATSRequestForm): void {
    this._newJobAtsFormValues.set(values);
  }

  public setTailoredResume(resume: TailoredResume): void {
    this._tailoredResume.set(resume);
  }

  /**
   * TODO: Future Improvements
   * - Need to remove "setResumeFile" and "setTailoredResume" line after resume selection handled on BE
   */
  public setResumeFile(file: File): void {
    this._resumeFile.set(file);
  }

  public resetState(): void {
    this._atsMatchScore.set(null);
    this._tailoredResume.set(null);
    this._newJobAtsFormValues.set(null);
    this._resumeFile.set(null);
  }
}
