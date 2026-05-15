import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Output,
  signal,
  ViewChild,
  input,
} from '@angular/core';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['application/pdf'];

@Component({
  selector: 'app-onboarding-upload-panel',
  standalone: true,
  templateUrl: './onboarding-upload-panel.component.html',
  styleUrls: ['./onboarding-upload-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingUploadPanelComponent {
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  @Output() readonly fileSelected = new EventEmitter<File>();

  /** Parent-driven flag: an upload is currently in flight. */
  readonly isUploading = input<boolean>(false);
  readonly uploadingFileName = input<string | null>(null);
  readonly uploadingFileSizeKb = input<number | null>(null);

  readonly isDragging = signal(false);
  readonly validationError = signal<string | null>(null);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (this.isUploading()) return;
    this.isDragging.set(true);
  }

  onDragLeave(): void {
    if (this.isUploading()) return;
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (this.isUploading()) return;
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.processFile(file);
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file && !this.isUploading()) this.processFile(file);
    input.value = '';
  }

  openFilePicker(): void {
    if (this.isUploading()) return;
    this.fileInputRef.nativeElement.click();
  }

  private processFile(file: File): void {
    this.validationError.set(null);
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      this.validationError.set('Only PDF files are supported.');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.validationError.set('File exceeds the 5 MB limit.');
      return;
    }
    this.fileSelected.emit(file);
  }
}
