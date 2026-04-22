import { Component, input, output } from '@angular/core';
import { CoverLetterResult } from '@features/resume-tailoring/models/cover-letter.model';
import { saveAs } from 'file-saver';
import { SnackbarService } from '@shared/services/snackbar.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-cover-letter-preview',
  standalone: true,
  imports: [],
  templateUrl: './cover-letter-preview.component.html',
})
export class CoverLetterPreviewComponent {
  private readonly snackbar = inject(SnackbarService);

  coverLetter = input.required<CoverLetterResult>();
  dismissed = output<void>();

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
    navigator.clipboard.writeText(this.fullText).then(() => {
      this.snackbar.showSuccess('Cover letter copied to clipboard!');
    }).catch(() => {
      this.snackbar.showError('Failed to copy. Please select and copy manually.');
    });
  }

  onDownloadText(): void {
    const cl = this.coverLetter()?.coverLetter;
    const name = cl?.candidateName?.replace(/\s+/g, '_') ?? 'Cover';
    const filename = `Cover_Letter_${name}.txt`;
    const blob = new Blob([this.fullText], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, filename);
  }
}
