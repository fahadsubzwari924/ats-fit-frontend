import { computed, Injectable, signal, inject } from '@angular/core';
import { TailoredResume } from '@features/resume-tailoring/models/tailored-resume.model';
import { ResumeService } from '@shared/services/resume.service';

@Injectable({
  providedIn: 'root',
})
export class ResumeState {
  private resumeService = inject(ResumeService);

  private _tailoredResume = signal<TailoredResume | null>(null);

  /**
   * Templates are managed by ResumeService with caching.
   * This computed signal provides backward compatibility for components using state.
   */
  public readonly templates = computed(
    () => this.resumeService.availableTemplates() ?? []
  );

  private _resumeFile = signal<File | null>(null);
  public readonly resumeFile = this._resumeFile.asReadonly();
  public readonly tailoredResume = this._tailoredResume.asReadonly();

  public setTailoredResume(resume: TailoredResume): void {
    this._tailoredResume.set(resume);
  }

  public setResumeFile(file: File): void {
    this._resumeFile.set(file);
  }

  public resetState(): void {
    this._tailoredResume.set(null);
    this._resumeFile.set(null);
  }
}
