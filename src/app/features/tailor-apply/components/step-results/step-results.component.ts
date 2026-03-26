import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  animate,
  group,
  query,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { TailoredResume } from '@features/resume-tailoring/models/tailored-resume.model';
import { TailoringModeBadgeComponent } from '@features/resume-tailoring/components/tailoring-mode-badge/tailoring-mode-badge.component';
import { ResumeComparisonComponent } from '../resume-comparison/resume-comparison.component';
import { CoverLetterPreviewComponent } from '../cover-letter-preview/cover-letter-preview.component';
import { UserState } from '@core/states/user.state';
import { CoverLetterService } from '@shared/services/cover-letter.service';
import { CoverLetterResult } from '@features/resume-tailoring/models/cover-letter.model';
import { saveAs } from 'file-saver';
import { SnackbarService } from '@shared/services/snackbar.service';
import { Messages } from '@core/enums/messages.enum';
import { DownloadFileName } from '@core/enums/download-file-name.enum';

type ActivePanel = 'none' | 'comparison' | 'coverLetter';

@Component({
  selector: 'app-step-results',
  standalone: true,
  imports: [
    FormsModule,
    TailoringModeBadgeComponent,
    ResumeComparisonComponent,
    CoverLetterPreviewComponent,
  ],
  templateUrl: './step-results.component.html',
  animations: [
    trigger('panelSwitch', [
      transition('* <=> *', [
        query(':leave', [
          style({ position: 'absolute', width: '100%', top: 0, left: 0, opacity: 1 }),
        ], { optional: true }),
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
        ], { optional: true }),
        group([
          query(':leave', [
            animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-16px)' })),
          ], { optional: true }),
          query(':enter', [
            animate('300ms 120ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
          ], { optional: true }),
        ]),
      ]),
    ]),
  ],
})
export class StepResultsComponent {
  private readonly userState = inject(UserState);
  private readonly snackbar = inject(SnackbarService);
  private readonly coverLetterService = inject(CoverLetterService);

  tailoredResume = input.required<TailoredResume>();

  download = output<void>();
  createAnother = output<void>();
  answerQuestionsFirst = output<void>();
  trackApplication = output<boolean>();

  readonly isPremiumUser = this.userState.isPremiumUser;

  trackChecked = false;
  activePanel = signal<ActivePanel>('none');
  isGeneratingCoverLetter = signal(false);
  coverLetterResult = signal<CoverLetterResult | null>(null);

  onDownload(): void {
    const resume = this.tailoredResume();
    if (!resume?.blob) {
      this.snackbar.showWarning(Messages.NO_RESUME_AVAILABLE);
      return;
    }
    saveAs(resume.blob, DownloadFileName.TAILORED_RESUME);
    this.download.emit();
  }

  onDone(): void {
    this.trackApplication.emit(this.trackChecked);
  }

  openComparison(): void {
    this.activePanel.set('comparison');
  }

  onCloseComparison(): void {
    this.activePanel.set('none');
  }

  onGenerateCoverLetter(): void {
    const resumeGenerationId = this.tailoredResume()?.resumeGenerationId;
    if (!resumeGenerationId) {
      this.snackbar.showError('Resume generation ID not found.');
      return;
    }

    if (this.coverLetterResult()) {
      this.activePanel.set('coverLetter');
      return;
    }

    this.isGeneratingCoverLetter.set(true);
    this.coverLetterService.generateFromResumeGeneration(resumeGenerationId).subscribe({
      next: (result) => {
        this.coverLetterResult.set(result);
        this.isGeneratingCoverLetter.set(false);
        this.activePanel.set('coverLetter');
      },
      error: (err) => {
        this.isGeneratingCoverLetter.set(false);
        this.snackbar.showError(
          err?.error?.message ?? 'Failed to generate cover letter. Please try again.',
        );
      },
    });
  }

  onCloseCoverLetter(): void {
    this.activePanel.set('none');
  }
}
