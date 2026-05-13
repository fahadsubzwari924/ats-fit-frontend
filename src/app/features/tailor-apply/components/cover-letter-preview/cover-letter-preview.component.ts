import { Component, inject, input, output, signal } from '@angular/core';
import { CoverLetterResult } from '@features/resume-tailoring/models/cover-letter.model';
import { CoverLetterService } from '@shared/services/cover-letter.service';
import { saveAs } from 'file-saver';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ApiErrorService } from '@shared/services/api-error.service';

@Component({
  selector: 'app-cover-letter-preview',
  standalone: true,
  imports: [],
  templateUrl: './cover-letter-preview.component.html',
})
export class CoverLetterPreviewComponent {
  private readonly snackbar = inject(SnackbarService);
  private readonly coverLetterService = inject(CoverLetterService);
  private readonly apiErrorService = inject(ApiErrorService);

  coverLetter = input.required<CoverLetterResult>();
  /**
   * Required for server-side PDF rendering. The component does not have
   * enough context to produce a faithful PDF on its own — the backend owns
   * the template so byte-output is consistent with the tailored-resume PDF.
   */
  resumeGenerationId = input.required<string>();
  jobPosition = input<string>('');
  candidateName = input<string>('');
  dismissed = output<void>();

  readonly isDownloading = signal(false);

  get fullText(): string {
    const cl = this.coverLetter()?.coverLetter;
    if (!cl) return '';
    const paragraphs = [
      cl.greeting,
      cl.opening,
      ...(cl.body ?? []),
      cl.closing,
      cl.signoff,
      cl.candidateName,
    ].filter(Boolean);
    return paragraphs.join('\n\n');
  }

  onCopyText(): void {
    navigator.clipboard
      .writeText(this.fullText)
      .then(() => {
        this.snackbar.showSuccess('Cover letter copied to clipboard!');
      })
      .catch(() => {
        this.snackbar.showError('Failed to copy. Please select and copy manually.');
      });
  }

  onDownloadPdf(): void {
    if (this.isDownloading()) return;
    const id = this.resumeGenerationId();
    if (!id) {
      this.snackbar.showError('Could not download cover letter — missing resume reference.');
      return;
    }

    this.isDownloading.set(true);
    this.coverLetterService.downloadPdf(id).subscribe({
      next: ({ blob, filename }) => {
        saveAs(blob, filename);
        this.isDownloading.set(false);
      },
      error: (err) => {
        this.isDownloading.set(false);
        const parsed = this.apiErrorService.parse(err, {
          defaultMessage: 'Could not download cover letter. Please try again.',
        });
        this.snackbar.showError(parsed.message);
      },
    });
  }
}
