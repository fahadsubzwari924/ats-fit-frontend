# Resume Required End-to-End Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make resume upload mandatory across the entire product — onboarding flows directly to a polished upload screen (no skip), dashboard blocks tailoring until a resume exists, and the tailoring modal no longer offers in-modal resume switching or upload.

**Architecture:** Four independent frontend changes in the Angular app. No backend changes required — the backend already uses the user's stored resume when no `resumeFile` is sent, and `PATCH /users/onboarding/complete` is only reached after a successful upload now. Tasks: (0) redesign the onboarding upload screen UX/content, (1) strip the choice/skip paths from onboarding, (2) add a resume gate to the dashboard modal-opening methods, (3) remove "Use a different resume" from the tailoring modal.

**Tech Stack:** Angular 19 standalone components, TypeScript, Angular signals, Tailwind CSS utility classes, Angular Material (mat-dialog), RxJS.

---

## File Map

| File | Change |
|------|--------|
| `src/app/features/onboarding/components/onboarding-upload-panel/onboarding-upload-panel.component.html` | Redesign: new heading/subheading, trust signals above drop zone, privacy micro-copy, polished drop zone |
| `src/app/features/onboarding/components/onboarding-upload-panel/onboarding-upload-panel.component.ts` | Remove `skip` and `back` outputs |
| `src/app/features/onboarding/models/onboarding-step.type.ts` | Remove `'choice'` from union |
| `src/app/features/onboarding/onboarding.component.ts` | Remove skip/choice/back logic; start at `'upload'`; add snackbar on upload error |
| `src/app/features/onboarding/onboarding.component.html` | Remove choice panel block; hardcode left panel; remove skip/back bindings |
| `src/app/features/onboarding/components/onboarding-left-panel/onboarding-left-panel.component.ts` | Remove `screen` input |
| `src/app/features/onboarding/components/onboarding-left-panel/onboarding-left-panel.component.html` | Remove choice block; simplify to upload content only, remove step pills |
| `src/app/features/dashboard/dashboard.component.ts` | Add `hasResume` computed; gate `openTailorModal` / `openBatchTailoringModal` |
| `src/app/features/dashboard/dashboard.component.html` | Add no-resume banner above grid |
| `src/app/features/tailor-apply/components/step-resume-source/step-resume-source.component.ts` | Remove `resumeFile` input, `fileSelected` output, `useUpload` signal, upload logic |
| `src/app/features/tailor-apply/components/step-resume-source/step-resume-source.component.html` | Remove upload area, "Use a different resume" button, "Upload a different file" block |
| `src/app/features/tailor-apply/tailor-apply-modal.component.ts` | Remove `resumeFile` signal, `onFileSelected`; simplify `buildPayload` |
| `src/app/features/tailor-apply/tailor-apply-modal.component.html` | Remove `[resumeFile]` and `(fileSelected)` bindings on step 2 |

---

## Task 0: Redesign Onboarding Upload Screen

The upload panel is now the cold entry point — no choice screen warms users up first. The current design is purely transactional. This task makes the screen guide, reassure, and convert.

**What changes:**
- Heading reframed from action ("Upload your resume") to value ("Your resume powers everything")
- Subheading explains the WHY in one sentence
- Trust signals moved **above** the drop zone (reduce anxiety before the action)
- Privacy micro-copy added below the drop zone
- Drop zone visually polished with a better icon treatment and clearer label hierarchy

**Files:**
- Modify: `src/app/features/onboarding/components/onboarding-upload-panel/onboarding-upload-panel.component.html`

---

- [ ] **Step 0.1: Replace upload panel HTML with redesigned version**

Replace full content of `src/app/features/onboarding/components/onboarding-upload-panel/onboarding-upload-panel.component.html`:

```html
<div class="upload-panel">

  <!-- Heading -->
  <div class="upload-panel__heading anim-fade">
    <h1 class="upload-panel__title">
      Your resume<br />powers everything
    </h1>
    <p class="upload-panel__subtitle">
      Upload once — ATS Fit analyzes it and uses it to precision-tailor every application you create.
    </p>
  </div>

  <!-- Trust signals (above the drop zone to reduce anxiety before action) -->
  <div class="upload-panel__signals anim-float">
    <div class="upload-panel__signal">
      <span class="upload-panel__signal-icon">&#9650;</span>
      <span>3&times; better ATS match</span>
    </div>
    <div class="upload-panel__signal">
      <span class="upload-panel__signal-icon">&#9201;</span>
      <span>Background analysis</span>
    </div>
    <div class="upload-panel__signal">
      <span class="upload-panel__signal-icon">&#10003;</span>
      <span>Dashboard in seconds</span>
    </div>
  </div>

  <!-- Drop zone -->
  <div
    class="upload-panel__dropzone anim-float2"
    [class.upload-panel__dropzone--active]="isDragging()"
    (dragover)="onDragOver($event)"
    (dragleave)="onDragLeave()"
    (drop)="onDrop($event)"
    (click)="openFilePicker()"
    role="button"
    tabindex="0"
    (keydown.enter)="openFilePicker()"
    aria-label="Upload resume file"
  >
    <div class="upload-panel__icon-wrap" [class.upload-panel__icon-wrap--active]="isDragging()">
      <span class="upload-panel__icon">&#8679;</span>
    </div>

    <p class="upload-panel__drop-title">
      {{ isDragging() ? 'Release to upload' : 'Drop your resume here' }}
    </p>
    <p class="upload-panel__drop-sub">or click to browse from your computer</p>

    <div class="upload-panel__formats">
      <span>PDF</span>
      <span class="upload-panel__formats-divider"></span>
      <span>Word (.docx)</span>
      <span class="upload-panel__formats-divider"></span>
      <span>Max 5 MB</span>
    </div>

    <input
      #fileInput
      type="file"
      accept=".pdf,.docx"
      class="upload-panel__file-input"
      (change)="onFileInputChange($event)"
    />
  </div>

  <!-- Validation error -->
  @if (validationError()) {
    <p class="upload-panel__error">{{ validationError() }}</p>
  }

  <!-- Privacy micro-copy -->
  <p class="upload-panel__privacy anim-float3">
    &#128274; Stored securely &nbsp;&middot;&nbsp; Never shared &nbsp;&middot;&nbsp; Deleted on request
  </p>

</div>
```

- [ ] **Step 0.2: Add `upload-panel__privacy` style to the upload panel SCSS**

Open `src/app/features/onboarding/components/onboarding-upload-panel/onboarding-upload-panel.component.scss` and append at the end:

```scss
.upload-panel__privacy {
  margin-top: 0.75rem;
  text-align: center;
  font-size: 0.7rem;
  color: var(--color-text-muted, #94a3b8);
  letter-spacing: 0.01em;
}
```

---

## Task 1: Mandatory Onboarding Upload (Remove Choice / Skip Paths)

Remove the choice panel and all skip paths. Onboarding now opens directly on the upload step and stays there until the user successfully uploads a resume.

**Files:**
- Modify: `src/app/features/onboarding/models/onboarding-step.type.ts`
- Modify: `src/app/features/onboarding/onboarding.component.ts`
- Modify: `src/app/features/onboarding/onboarding.component.html`
- Modify: `src/app/features/onboarding/components/onboarding-upload-panel/onboarding-upload-panel.component.ts`
- Modify: `src/app/features/onboarding/components/onboarding-left-panel/onboarding-left-panel.component.ts`
- Modify: `src/app/features/onboarding/components/onboarding-left-panel/onboarding-left-panel.component.html`

---

- [ ] **Step 1.1: Update the step type**

Replace full content of `src/app/features/onboarding/models/onboarding-step.type.ts`:

```typescript
export type OnboardingStep = 'upload' | 'submitted';
```

- [ ] **Step 1.2: Replace `onboarding.component.ts`**

Replace full file content:

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { OnboardingStep } from './models/onboarding-step.type';
import { OnboardingService } from './services/onboarding.service';
import { UserState } from '@core/states/user.state';
import { ResumeProfileState } from '@core/states/resume-profile.state';
import { SnackbarService } from '@shared/services/snackbar.service';
import { AppRoutes } from '@core/constants/app-routes.contant';
import { OnboardingLeftPanelComponent } from './components/onboarding-left-panel/onboarding-left-panel.component';
import { OnboardingUploadPanelComponent } from './components/onboarding-upload-panel/onboarding-upload-panel.component';
import { OnboardingSubmittedScreenComponent } from './components/onboarding-submitted-screen/onboarding-submitted-screen.component';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    OnboardingLeftPanelComponent,
    OnboardingUploadPanelComponent,
    OnboardingSubmittedScreenComponent,
  ],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingComponent {
  private readonly router = inject(Router);
  private readonly onboardingService = inject(OnboardingService);
  private readonly userState = inject(UserState);
  private readonly profileState = inject(ResumeProfileState);
  private readonly snackbar = inject(SnackbarService);

  readonly step = signal<OnboardingStep>('upload');
  readonly uploadedFile = signal<File | null>(null);

  get uploadedFileName(): string | null {
    return this.uploadedFile()?.name ?? null;
  }

  get uploadedFileSizeKb(): number | null {
    const file = this.uploadedFile();
    return file ? Math.round(file.size / 1024) : null;
  }

  onFileSelected(file: File): void {
    this.uploadedFile.set(file);

    this.onboardingService.uploadResume(file).subscribe({
      next: () => {
        this.profileState.setProfileStatus({
          hasResume: true,
          processingStatus: 'processing',
          questionsTotal: 0,
          questionsAnswered: 0,
          profileCompleteness: 0,
          enrichedProfileId: null,
          tailoringMode: 'none',
        });
        this.step.set('submitted');
      },
      error: (err) => {
        this.uploadedFile.set(null);
        this.snackbar.showError(err?.error?.message ?? 'Upload failed. Please try again.');
      },
    });
  }

  onGoToDashboard(): void {
    this.completeThenNavigate();
  }

  private completeThenNavigate(): void {
    this.onboardingService.completeOnboarding().subscribe({
      next: (updatedUser) => {
        this.userState.setUser(updatedUser);
        this.router.navigateByUrl(AppRoutes.DASHBOARD);
      },
      error: () => {
        this.userState.markOnboardingComplete();
        this.router.navigateByUrl(AppRoutes.DASHBOARD);
      },
    });
  }
}
```

- [ ] **Step 1.3: Replace `onboarding.component.html`**

Replace full file content:

```html
@if (step() === 'submitted') {
  <app-onboarding-submitted-screen
    [fileName]="uploadedFileName"
    [fileSizeKb]="uploadedFileSizeKb"
    (goToDashboard)="onGoToDashboard()"
  />
} @else {
  <div class="onboarding-layout">
    <app-onboarding-left-panel />
    <main class="onboarding-layout__right">
      <app-onboarding-upload-panel
        (fileSelected)="onFileSelected($event)"
      />
    </main>
  </div>
}
```

- [ ] **Step 1.4: Remove `skip` and `back` outputs from upload panel TS**

Replace full content of `src/app/features/onboarding/components/onboarding-upload-panel/onboarding-upload-panel.component.ts`:

```typescript
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
```

- [ ] **Step 1.5: Simplify left panel TS — remove `screen` input**

Replace full content of `src/app/features/onboarding/components/onboarding-left-panel/onboarding-left-panel.component.ts`:

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-onboarding-left-panel',
  standalone: true,
  templateUrl: './onboarding-left-panel.component.html',
  styleUrls: ['./onboarding-left-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingLeftPanelComponent {}
```

- [ ] **Step 1.6: Simplify left panel HTML — remove choice block and step pills**

Replace full content of `src/app/features/onboarding/components/onboarding-left-panel/onboarding-left-panel.component.html`:

```html
<div class="onboarding-left">

  <!-- Logo -->
  <div class="onboarding-left__logo">
    <svg width="34" height="34" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="rgba(255,255,255,0.15)" />
      <path d="M8 22L12 10L16 18L20 10L24 22" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="16" cy="18" r="1.5" fill="white" />
    </svg>
    <span class="onboarding-left__logo-text">ATS Fit</span>
  </div>

  <section class="onboarding-left__body">
    <p class="onboarding-left__eyebrow">One-time setup</p>
    <h2 class="onboarding-left__headline">
      Your resume,<br />
      analyzed to<br />
      perfection.
    </h2>
    <p class="onboarding-left__copy">
      Upload once, use forever. Our analysis engine extracts everything needed for precision tailoring.
    </p>

    <div class="onboarding-left__list">
      <p class="onboarding-left__list-label">What we extract</p>
      <div class="onboarding-left__list-item">
        <span class="onboarding-left__check-icon">&#10003;</span>
        Work experience structure
      </div>
      <div class="onboarding-left__list-item">
        <span class="onboarding-left__check-icon">&#10003;</span>
        Quantifiable achievements
      </div>
      <div class="onboarding-left__list-item">
        <span class="onboarding-left__check-icon">&#10003;</span>
        Skills &amp; keyword density
      </div>
      <div class="onboarding-left__list-item">
        <span class="onboarding-left__check-icon">&#10003;</span>
        Impact metrics &amp; outcomes
      </div>
    </div>

    <div class="onboarding-left__note">
      <p class="onboarding-left__note-title">&#9889; Runs in the background</p>
      <p class="onboarding-left__note-copy">
        Takes ~40–50 seconds. You go straight to your dashboard — we'll notify you when it's done.
      </p>
    </div>
  </section>

</div>
```

- [ ] **Step 1.7: Type check**

```bash
cd /Users/fahadsubzwari924/Documents/sideProjects/ATS_FIT/ats-fit-frontend
npx tsc --noEmit
```

Expected: no errors (especially none about missing `screen` input, removed outputs, or `'choice'` type).

---

## Task 2: Dashboard Resume Gate

Block tailor and batch-tailor modals from opening when no resume exists. Show a clear contextual banner guiding the user to upload.

**Files:**
- Modify: `src/app/features/dashboard/dashboard.component.ts`
- Modify: `src/app/features/dashboard/dashboard.component.html`

---

- [ ] **Step 2.1: Add `hasResume` computed and gate logic to `dashboard.component.ts`**

Add `computed` to the Angular core import line. Change:
```typescript
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
```
to:
```typescript
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
```

Add the following computed signal after the existing signal declarations (after `showPostTailorUpgradeNudge`, around line 80):

```typescript
readonly hasResume = computed(() => (this.userState.uploadedResumes()?.length ?? 0) > 0);
```

Replace `openTailorModal()` with:

```typescript
public openTailorModal(): void {
  if (!this.hasResume()) {
    this.snackbarService.showWarning('Upload your resume first to use AI tailoring.');
    document.getElementById('dashboard-profile')?.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  this.modalService
    .openModal(TailorApplyModalComponent, undefined, { width: '620px', maxWidth: '95vw', panelClass: 'tailor-modal-panel' })
    .afterClosed()
    .subscribe({
      next: (result) => this.handleTailoringModalClosed(result),
    });
}
```

Replace `openBatchTailoringModal()` with:

```typescript
public openBatchTailoringModal(): void {
  if (!this.hasResume()) {
    this.snackbarService.showWarning('Upload your resume first to use batch tailoring.');
    document.getElementById('dashboard-profile')?.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  if (!this.userState.isPremiumUser()) {
    this.modalService
      .openModal(UpgradeFeatureDialogComponent, undefined, {
        width: '420px',
        maxWidth: '95vw',
        panelClass: 'upgrade-feature-dialog-panel',
      })
      .afterClosed()
      .subscribe();
    return;
  }

  this.modalService
    .openModal(BatchTailoringModalComponent, undefined, {
      width: '640px',
      maxWidth: '95vw',
      panelClass: 'tailor-modal-panel',
    })
    .afterClosed()
    .subscribe({
      next: (result) => this.handleTailoringModalClosed(result),
    });
}
```

- [ ] **Step 2.2: Add no-resume banner to `dashboard.component.html`**

Add the following block immediately after the `<app-questions-banner ...>` line and before the `@if (showPostTailorUpgradeNudge())` block:

```html
@if (!hasResume()) {
  <div class="max-w-[1280px] mx-auto px-6 pt-4">
    <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-4">
      <div class="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" class="text-amber-600">
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-amber-900">Upload your resume to unlock tailoring</p>
        <p class="text-xs text-amber-700 mt-0.5">
          ATS Fit needs your resume to generate precision-tailored applications. Upload it in the Resume Management section below.
        </p>
      </div>
    </div>
  </div>
}
```

- [ ] **Step 2.3: Type check**

```bash
cd /Users/fahadsubzwari924/Documents/sideProjects/ATS_FIT/ats-fit-frontend
npx tsc --noEmit
```

Expected: no errors.

---

## Task 3: Remove "Use a Different Resume" from Tailoring Modal

The `StepResumeSourceComponent` currently lets users upload a different resume mid-flow. Remove that entire capability — when the modal opens, the user's saved resume is shown read-only and Continue is always enabled.

**Files:**
- Modify: `src/app/features/tailor-apply/components/step-resume-source/step-resume-source.component.ts`
- Modify: `src/app/features/tailor-apply/components/step-resume-source/step-resume-source.component.html`
- Modify: `src/app/features/tailor-apply/tailor-apply-modal.component.ts`
- Modify: `src/app/features/tailor-apply/tailor-apply-modal.component.html`

---

- [ ] **Step 3.1: Replace `step-resume-source.component.ts`**

Replace full file content:

```typescript
import { Component, computed, inject, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { UserState } from '@core/states/user.state';
import { SnackbarService } from '@shared/services/snackbar.service';
import { Messages } from '@core/enums/messages.enum';

@Component({
  selector: 'app-step-resume-source',
  standalone: true,
  imports: [NgClass],
  templateUrl: './step-resume-source.component.html',
})
export class StepResumeSourceComponent {
  private readonly userState = inject(UserState);
  private readonly snackbar = inject(SnackbarService);

  next = output<void>();

  readonly uploadedResumes = this.userState.uploadedResumes;
  readonly hasSavedResume = computed(() => (this.uploadedResumes()?.length ?? 0) > 0);

  onNext(): void {
    if (this.hasSavedResume()) {
      this.next.emit();
    } else {
      this.snackbar.showWarning(Messages.PLEASE_UPLOAD_A_RESUME_FILE);
    }
  }
}
```

- [ ] **Step 3.2: Replace `step-resume-source.component.html`**

Replace full file content:

```html
<div class="space-y-4">

  <!-- Saved resume chip (read-only) -->
  @if (hasSavedResume()) {
    <div class="bg-success-soft border border-success-border rounded-xl p-4">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 bg-success rounded-lg flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2.5" class="text-white">
            <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
            <path d="m9 11 3 3L22 4"></path>
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-success-strong">Resume ready</p>
          @for (resume of uploadedResumes(); track resume.id) {
            <p class="text-xs text-success-strong truncate">{{ resume.fileName }}</p>
          }
        </div>
      </div>
    </div>
  }

  <!-- Continue button -->
  <button
    (click)="onNext()"
    [disabled]="!hasSavedResume()"
    class="w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
    [ngClass]="hasSavedResume()
      ? 'bg-primary hover:bg-primary-hover text-white shadow-md hover:shadow-primary/25 hover:shadow-lg'
      : 'bg-slate-100 text-slate-400 cursor-not-allowed'"
  >
    Continue →
  </button>
</div>
```

- [ ] **Step 3.3: Remove `resumeFile` and `onFileSelected` from `tailor-apply-modal.component.ts`**

1. Remove `resumeFile = signal<File | null>(null);`

2. Remove the `onFileSelected` method:
```typescript
// DELETE this entire method:
onFileSelected(file: File): void {
  this.resumeFile.set(file);
}
```

3. Replace `buildPayload()` with:
```typescript
private buildPayload(): FormData {
  const fd = new FormData();
  const v = this.form.value;
  fd.append('jobPosition', v.jobPosition);
  fd.append('companyName', v.companyName);
  fd.append('jobDescription', v.jobDescription);
  fd.append('templateId', v.selectedTemplate);
  return fd;
}
```

4. Replace `onCreateAnother()` with (remove the `resumeFile.set(null)` line):
```typescript
onCreateAnother(): void {
  this.form.reset();
  this.tailoredResume.set(null);
  this.isProcessing.set(false);
  this.progress.set(0);
  this.currentStep.set(1);
}
```

- [ ] **Step 3.4: Remove bindings from `tailor-apply-modal.component.html`**

Replace the `@case (2)` block. Old:
```html
@case (2) {
  <app-step-resume-source
    [resumeFile]="resumeFile()"
    (fileSelected)="onFileSelected($event)"
    (next)="onNext()">
  </app-step-resume-source>
}
```

New:
```html
@case (2) {
  <app-step-resume-source
    (next)="onNext()">
  </app-step-resume-source>
}
```

- [ ] **Step 3.5: Type check**

```bash
cd /Users/fahadsubzwari924/Documents/sideProjects/ATS_FIT/ats-fit-frontend
npx tsc --noEmit
```

Expected: no errors.

---

## Self-Review Checklist

- [x] **Spec coverage**
  - Onboarding upload screen: new heading/value-first copy ✓ | trust signals above drop zone ✓ | privacy micro-copy ✓ | polished drop zone ✓
  - Onboarding flow: choice panel removed ✓ | skip from upload removed ✓ | back button removed ✓ | snackbar on upload error (stays on upload step) ✓
  - Dashboard: tailoring blocked without resume ✓ | batch tailoring blocked without resume ✓ | amber banner shown ✓ | both modals still work when resume present ✓
  - Tailor modal: "Use a different resume" button gone ✓ | "Upload a different file" button gone ✓ | inline upload area gone ✓ | `resumeFile` removed from `buildPayload` ✓

- [x] **Placeholder scan** — no TBDs, all code blocks complete

- [x] **Type consistency** — `OnboardingStep` is `'upload' | 'submitted'` everywhere; `hasResume` is `computed(() => boolean)`; `next = output<void>()` matches `(next)="onNext()"` binding

- [x] **Backend** — No changes needed. `POST /resume-tailoring/generate` already uses the stored resume when no `resumeFile` appended. `PATCH /users/onboarding/complete` is only reached from the submitted screen which only appears after a successful upload.
