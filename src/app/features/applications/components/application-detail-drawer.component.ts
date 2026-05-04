import { NgClass } from '@angular/common';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import {
  animate,
  AnimationTriggerMetadata,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  HostListener,
  inject,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { catchError, of, Subscription } from 'rxjs';
// Use the expanded applications-feature model; cast to Record<string,unknown> when calling JobService
// which still types its methods against the legacy apply-new-job model.
import { JobApplication } from '@features/applications/models/job-application.model';
import { JobApplicationUpdatePayload } from '@features/applications/models/job-application-update-payload.model';
import { JobService } from '@features/apply-new-job/services/job.service';
import { ApplicationStatusSelectComponent } from '@features/applications/components/application-status-select.component';
import { PipelineSectionComponent } from '@features/applications/components/sections/pipeline-section.component';
import { fromDateInputToIso, toDateInputValue } from '@features/applications/lib/date-input-helpers';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ModalService } from '@shared/services/modal.service';
import { DiscardChangesDialogComponent } from '@features/applications/components/discard-changes-dialog.component';
import { JobDetailsSectionComponent } from '@features/applications/components/sections/job-details-section.component';
import { CompensationSectionComponent } from '@features/applications/components/sections/compensation-section.component';
import { ContactsSectionComponent } from '@features/applications/components/sections/contacts-section.component';
import { InterviewsSectionComponent } from '@features/applications/components/sections/interviews-section.component';
import { NoteTagsSectionComponent } from '@features/applications/components/sections/notes-tags-section.component';
import { RejectionSectionComponent } from '@features/applications/components/sections/rejection-section.component';
import { OfferSectionComponent } from '@features/applications/components/sections/offer-section.component';
import { ActivityTimelineComponent } from '@features/applications/components/sections/activity-timeline.component';

const drawerAnimations: AnimationTriggerMetadata[] = [
  trigger('backdropFade', [
    transition(':enter', [
      style({ opacity: 0 }),
      animate('300ms ease-out', style({ opacity: 1 })),
    ]),
    transition(':leave', [
      animate('250ms ease-in', style({ opacity: 0 })),
    ]),
  ]),
  trigger('drawerPanel', [
    transition(':enter', [
      style({ transform: 'translateX(100%)' }),
      animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateX(0)' })),
    ]),
    transition(':leave', [
      animate('250ms cubic-bezier(0.4, 0, 1, 1)', style({ transform: 'translateX(100%)' })),
    ]),
  ]),
];

@Component({
  selector: 'app-application-detail-drawer',
  standalone: true,
  imports: [
    NgClass,
    ReactiveFormsModule,
    CdkTrapFocus,
    ApplicationStatusSelectComponent,
    JobDetailsSectionComponent,
    PipelineSectionComponent,
    CompensationSectionComponent,
    InterviewsSectionComponent,
    NoteTagsSectionComponent,
    RejectionSectionComponent,
    OfferSectionComponent,
    ActivityTimelineComponent,
    ContactsSectionComponent,
  ],
  templateUrl: './application-detail-drawer.component.html',
  styleUrl: './application-detail-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: drawerAnimations,
})
export class ApplicationDetailDrawerComponent implements OnDestroy {
  private readonly jobService = inject(JobService);
  private readonly snackbar = inject(SnackbarService);
  private readonly modalService = inject(ModalService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly jobId = input.required<string>();
  readonly closed = output<void>();
  readonly saved = output<void>();

  readonly visible = signal(true);
  readonly job = signal<JobApplication | null>(null);
  readonly openSection = signal<string>('jobDetails');
  readonly isLoading = signal(false);
  readonly saving = signal(false);
  readonly savedAt = signal<Date | null>(null);
  readonly savedAgoLabel = signal<string>('');
  readonly currentStatus = signal<string>('');

  /** Tracks the last-loaded raw model so Cancel can restore the form. */
  private lastLoaded: JobApplication | null = null;
  private savedAgoInterval: ReturnType<typeof setInterval> | null = null;

  readonly form = this.fb.group({
    jobDetails: this.fb.group({
      company_name: ['', Validators.required],
      job_position: ['', Validators.required],
      job_url: [null as string | null],
      job_location: [null as string | null],
      job_description: [null as string | null],
      job_board_source: [null as string | null],
      employment_type: [null as string | null],
      work_mode: [null as string | null],
    }),
    pipeline: this.fb.group({
      status: [null as string | null],
      priority: [null as string | null],
      applied_at: [null as string | null],
      applied_via: [null as string | null],
      application_deadline: [null as string | null],
      decision_deadline: [null as string | null],
      follow_up_date: [null as string | null],
      is_archived: [false as boolean],
    }),
    compensation: this.fb.group({
      salary_min: [null as number | null],
      salary_max: [null as number | null],
      salary_currency: [null as string | null],
      pay_period: [null as string | null],
    }),
    contacts: this.fb.group({
      recruiter_name: [null as string | null],
      recruiter_email: [null as string | null],
      hiring_manager_name: [null as string | null],
      hiring_manager_email: [null as string | null],
    }),
    notes: [null as string | null],
    tags: this.fb.nonNullable.control<string[]>([]),
    rejection: this.fb.group({
      rejection_reason: [null as string | null],
      rejection_stage: [null as string | null],
    }),
    offer: this.fb.group({
      base_salary: [null as number | null],
      currency: [null as string | null],
      period: [null as string | null],
      signing_bonus: [null as number | null],
      equity: [null as string | null],
      benefits_summary: [null as string | null],
      deadline_to_respond: [null as string | null],
    }),
  });

  constructor() {
    effect((onCleanup) => {
      const id = this.jobId();
      this.isLoading.set(true);
      this.job.set(null);
      this.lastLoaded = null;
      const sub: Subscription = this.jobService
        .getJobById(id, { params: {} })
        .pipe(
          catchError((err: unknown) => {
            this.isLoading.set(false);
            this.snackbar.showError(this.httpErrorMessage(err, 'Could not load application.'));
            this.beginClose();
            return of(null);
          }),
        )
        .subscribe((raw) => {
          this.isLoading.set(false);
          if (raw) {
            const j = new JobApplication(raw);
            this.job.set(j);
            this.lastLoaded = j;
            this.patchForm(j);
            this.form.markAsPristine();
          }
        });
      onCleanup(() => sub.unsubscribe());
    });
  }

  ngOnDestroy(): void {
    this.clearSavedAgoInterval();
  }

  // ── Header: reactive company name + job position ──────────────────────────

  get headerCompanyName(): string {
    return this.form.controls.jobDetails.controls.company_name.value?.trim() || 'Company';
  }

  get headerJobPosition(): string {
    return this.form.controls.jobDetails.controls.job_position.value?.trim() || 'Role';
  }

  get headerStatus(): string {
    return this.form.controls.pipeline.controls.status.value ?? '';
  }

  get headerPriority(): string {
    return this.form.controls.pipeline.controls.priority.value ?? '';
  }

  priorityDotClass(priority: string): string {
    switch (priority) {
      case 'high':
        return 'priority-dot priority-dot--high';
      case 'medium':
        return 'priority-dot priority-dot--medium';
      case 'low':
        return 'priority-dot priority-dot--low';
      case 'top_choice':
        return 'priority-dot priority-dot--top';
      default:
        return 'priority-dot priority-dot--none';
    }
  }

  formatUpdatedAgo(updatedAt: string | undefined): string {
    if (!updatedAt) {
      return '';
    }
    const diff = Date.now() - new Date(updatedAt).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) {
      return 'just now';
    }
    if (mins < 60) {
      return `${mins}m ago`;
    }
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) {
      return `${hrs}h ago`;
    }
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  // ── Footer dirty state ────────────────────────────────────────────────────

  get footerStatusLabel(): string {
    if (this.form.dirty) {
      return 'Unsaved changes';
    }
    const at = this.savedAt();
    if (at) {
      return this.savedAgoLabel() || 'Saved';
    }
    return '';
  }

  // ── Keyboard shortcut: Cmd/Ctrl+S ────────────────────────────────────────

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 's') {
      event.preventDefault();
      if (!this.form.pristine && !this.form.invalid && !this.saving()) {
        this.onSave();
      }
    }
  }

  // ── Status change from header pill ───────────────────────────────────────

  setOpen(section: string, isOpen: boolean): void {
    if (isOpen) {
      this.openSection.set(section);
    } else if (this.openSection() === section) {
      this.openSection.set('');
    }
  }

  onStatusChange(newStatus: string): void {
    this.form.controls.pipeline.controls.status.setValue(newStatus);
    this.form.controls.pipeline.controls.status.markAsDirty();
    this.currentStatus.set(newStatus);
  }

  // ── Close / backdrop / Esc ────────────────────────────────────────────────

  onBackdropClick(): void {
    this.tryClose();
  }

  onBackdropOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.tryClose();
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.tryClose();
    }
  }

  onPanelClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  onPanelKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.tryClose();
      return;
    }
    event.stopPropagation();
  }

  onCloseClick(): void {
    this.tryClose();
  }

  private tryClose(): void {
    if (this.form.pristine) {
      this.beginClose();
      return;
    }
    this.openDiscardDialog(() => {
      this.resetForm();
      this.beginClose();
    });
  }

  // ── Cancel ────────────────────────────────────────────────────────────────

  onCancel(): void {
    if (this.form.pristine) {
      this.beginClose();
      return;
    }
    this.openDiscardDialog(() => {
      this.resetForm();
    });
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  onSave(): void {
    if (this.form.invalid) {
      this.focusFirstInvalid();
      return;
    }

    const id = this.jobId();
    const payload = this.buildPayload();

    this.saving.set(true);
    // Cast payload to the legacy Record-based type accepted by JobService until service is updated.
    this.jobService
      .editJob(id, payload as Record<string, unknown>)
      .pipe(
        catchError((err: unknown) => {
          this.saving.set(false);
          this.snackbar.showError(this.httpErrorMessage(err, 'Could not save changes.'));
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((raw) => {
        this.saving.set(false);
        if (!raw) {
          return;
        }
        const updated = new JobApplication(raw);
        this.job.set(updated);
        this.lastLoaded = updated;
        this.patchForm(updated);
        this.form.markAsPristine();
        const now = new Date();
        this.savedAt.set(now);
        this.startSavedAgoTick(now);
        this.snackbar.showSuccess('Application updated.');
        this.saved.emit();
      });
  }

  // ── Animation ─────────────────────────────────────────────────────────────

  private beginClose(): void {
    this.visible.set(false);
  }

  onAnimationDone(event: { toState: string }): void {
    if (event.toState === 'void') {
      this.closed.emit();
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private patchForm(j: JobApplication): void {
    this.form.patchValue({
      jobDetails: {
        company_name: j.companyName ?? '',
        job_position: j.jobPosition ?? '',
        job_url: j.jobUrl ?? null,
        job_location: j.jobLocation ?? null,
        job_description: j.jobDescription ?? null,
        job_board_source: j.jobBoardSource ?? null,
        employment_type: j.employmentType ?? null,
        work_mode: j.workMode ?? null,
      },
      pipeline: {
        status: j.status ?? null,
        priority: j.priority ?? null,
        applied_at: toDateInputValue(j.appliedAt) || null,
        applied_via: j.appliedVia ?? null,
        application_deadline: toDateInputValue(j.applicationDeadline) || null,
        decision_deadline: toDateInputValue(j.decisionDeadline) || null,
        follow_up_date: toDateInputValue(j.followUpDate) || null,
        is_archived: false,
      },
      compensation: {
        salary_min: j.salaryMin ?? null,
        salary_max: j.salaryMax ?? null,
        salary_currency: j.salaryCurrency ?? null,
        pay_period: j.payPeriod ?? null,
      },
      contacts: {
        recruiter_name: j.recruiterName ?? null,
        recruiter_email: j.recruiterEmail ?? null,
        hiring_manager_name: j.hiringManagerName ?? null,
        hiring_manager_email: j.hiringManagerEmail ?? null,
      },
      notes: j.notes ?? null,
      tags: j.tags ?? [],
      rejection: {
        rejection_reason: j.rejectionReason ?? null,
        rejection_stage: j.rejectionStage ?? null,
      },

      offer: j.compensationOffer
        ? {
            base_salary: j.compensationOffer.base_salary ?? null,
            currency: j.compensationOffer.currency ?? null,
            period: j.compensationOffer.pay_period ?? null,
            signing_bonus: j.compensationOffer.sign_on_bonus ?? null,
            equity: j.compensationOffer.equity_notes ?? null,
            benefits_summary: j.compensationOffer.benefits_notes ?? null,
            deadline_to_respond: toDateInputValue(j.compensationOffer.decision_deadline) || null,
          }
        : {
            base_salary: null,
            currency: null,
            period: null,
            signing_bonus: null,
            equity: null,
            benefits_summary: null,
            deadline_to_respond: null,
          },
    });
    this.currentStatus.set(j.status ?? '');
  }

  private resetForm(): void {
    if (this.lastLoaded) {
      this.patchForm(this.lastLoaded);
      this.form.markAsPristine();
    }
  }

  private buildPayload(): JobApplicationUpdatePayload {
    const v = this.form.getRawValue();
    const payload: JobApplicationUpdatePayload = {};

    // Job details
    const jd = v.jobDetails;
    if (jd.company_name) {
      payload.company_name = jd.company_name;
    }
    if (jd.job_position) {
      payload.job_position = jd.job_position;
    }
    if (jd.job_url != null) {
      payload.job_url = jd.job_url;
    }
    if (jd.job_location != null) {
      payload.job_location = jd.job_location;
    }
    if (jd.job_description != null) {
      payload.job_description = jd.job_description;
    }
    if (jd.employment_type != null) {
      payload.employment_type = jd.employment_type as JobApplicationUpdatePayload['employment_type'];
    }
    if (jd.work_mode != null) {
      payload.work_mode = jd.work_mode as JobApplicationUpdatePayload['work_mode'];
    }
    if (jd.job_board_source != null) {
      payload.job_board_source = jd.job_board_source as JobApplicationUpdatePayload['job_board_source'];
    }

    // Pipeline
    const pl = v.pipeline;
    if (pl.status != null) {
      payload.status = pl.status as JobApplicationUpdatePayload['status'];
    }
    if (pl.priority != null) {
      payload.priority = pl.priority as JobApplicationUpdatePayload['priority'];
    }
    if (pl.applied_at != null) {
      payload.applied_at = fromDateInputToIso(pl.applied_at) ?? undefined;
    }
    if (pl.applied_via != null) {
      payload.applied_via = pl.applied_via as JobApplicationUpdatePayload['applied_via'];
    }
    if (pl.application_deadline != null) {
      payload.application_deadline = fromDateInputToIso(pl.application_deadline) ?? undefined;
    }
    if (pl.decision_deadline != null) {
      payload.decision_deadline = fromDateInputToIso(pl.decision_deadline) ?? undefined;
    }
    if (pl.follow_up_date != null) {
      payload.follow_up_date = fromDateInputToIso(pl.follow_up_date) ?? undefined;
    }

    // Compensation
    const comp = v.compensation;
    if (comp.salary_min != null) {
      payload.salary_min = comp.salary_min;
    }
    if (comp.salary_max != null) {
      payload.salary_max = comp.salary_max;
    }
    if (comp.salary_currency != null) {
      payload.salary_currency = comp.salary_currency;
    }
    if (comp.pay_period != null) {
      payload.pay_period = comp.pay_period as JobApplicationUpdatePayload['pay_period'];
    }

    // Contacts
    const ct = v.contacts;
    if (ct.recruiter_name != null) {
      payload.recruiter_name = ct.recruiter_name;
    }
    if (ct.recruiter_email != null) {
      payload.recruiter_email = ct.recruiter_email;
    }
    if (ct.hiring_manager_name != null) {
      payload.hiring_manager_name = ct.hiring_manager_name;
    }
    if (ct.hiring_manager_email != null) {
      payload.hiring_manager_email = ct.hiring_manager_email;
    }

    // Notes & tags
    if (v.notes != null) {
      payload.notes = v.notes;
    }
    if (v.tags != null) {
      payload.tags = v.tags;
    }

    // Rejection
    const rej = v.rejection;
    if (rej.rejection_reason != null) {
      payload.rejection_reason = rej.rejection_reason;
    }
    if (rej.rejection_stage != null) {
      payload.rejection_stage = rej.rejection_stage as JobApplicationUpdatePayload['rejection_stage'];
    }

    // Offer — map form fields to IJobApplicationCompensationOffer keys
    const off = v.offer;
    const hasOffer =
      off.base_salary != null ||
      off.currency != null ||
      off.period != null ||
      off.signing_bonus != null ||
      off.equity != null ||
      off.benefits_summary != null ||
      off.deadline_to_respond != null;
    if (hasOffer) {
      payload.compensation_offer = {
        base_salary: off.base_salary ?? undefined,
        currency: off.currency ?? undefined,
        pay_period: off.period as JobApplicationUpdatePayload['pay_period'] ?? undefined,
        sign_on_bonus: off.signing_bonus ?? undefined,
        equity_notes: off.equity ?? undefined,
        benefits_notes: off.benefits_summary ?? undefined,
        decision_deadline: off.deadline_to_respond
          ? fromDateInputToIso(off.deadline_to_respond)
          : undefined,
      };
    }

    return payload;
  }

  private openDiscardDialog(onConfirm: () => void): void {
    const ref = this.modalService.openModal<DiscardChangesDialogComponent>(
      DiscardChangesDialogComponent,
      undefined,
      { width: 'min(400px, calc(100vw - 2rem))', maxWidth: '96vw' },
    );
    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          onConfirm();
        }
      });
  }

  private focusFirstInvalid(): void {
    const el = document.querySelector<HTMLElement>(
      '.app-detail-drawer__panel [formControlName].ng-invalid',
    );
    el?.focus();
  }

  private startSavedAgoTick(savedAt: Date): void {
    this.clearSavedAgoInterval();
    const update = (): void => {
      const diff = Date.now() - savedAt.getTime();
      const secs = Math.floor(diff / 1000);
      if (secs < 60) {
        this.savedAgoLabel.set(`Saved ${secs}s ago`);
      } else {
        this.savedAgoLabel.set(`Saved ${Math.floor(secs / 60)}m ago`);
      }
    };
    update();
    this.savedAgoInterval = setInterval(update, 10_000);
  }

  private clearSavedAgoInterval(): void {
    if (this.savedAgoInterval != null) {
      clearInterval(this.savedAgoInterval);
      this.savedAgoInterval = null;
    }
  }

  private httpErrorMessage(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && 'error' in err) {
      const e = (err as { error?: { message?: string } }).error?.message;
      if (e) {
        return e;
      }
    }
    return fallback;
  }
}
