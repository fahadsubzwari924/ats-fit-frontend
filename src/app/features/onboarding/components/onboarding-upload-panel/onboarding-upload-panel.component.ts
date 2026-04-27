import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Output,
  signal,
  ViewChild,
} from '@angular/core';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

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

  readonly isDragging = signal(false);
  readonly validationError = signal<string | null>(null);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(): void {
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.processFile(file);
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.processFile(file);
    input.value = '';
  }

  openFilePicker(): void {
    this.fileInputRef.nativeElement.click();
  }

  private processFile(file: File): void {
    this.validationError.set(null);
    const isValidType =
      ALLOWED_MIME_TYPES.includes(file.type) || file.name.endsWith('.docx');
    if (!isValidType) {
      this.validationError.set('Only PDF and DOCX files are supported.');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.validationError.set('File exceeds the 5 MB limit.');
      return;
    }
    this.fileSelected.emit(file);
  }
}
