import {
  ChangeDetectionStrategy,
  Component,
  Input,
  signal,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AccordionSectionComponent } from '@shared/components/ui/accordion-section/accordion-section.component';
import { SegmentedControlComponent, SegmentedOption } from '@shared/components/ui/segmented-control/segmented-control.component';
import { EmploymentType } from '@features/applications/models/enums/employment-type.enum';
import { JobBoardSource } from '@features/applications/models/enums/job-board-source.enum';
import { WorkMode } from '@features/applications/models/enums/work-mode.enum';

@Component({
  selector: 'app-job-details-section',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AccordionSectionComponent,
    SegmentedControlComponent,
  ],
  templateUrl: './job-details-section.component.html',
  styleUrl: './job-details-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobDetailsSectionComponent {
  @Input({ required: true }) group!: FormGroup;

  readonly descriptionExpanded = signal(false);

  readonly workModeOptions: SegmentedOption[] = [
    { value: WorkMode.REMOTE, label: 'Remote' },
    { value: WorkMode.HYBRID, label: 'Hybrid' },
    { value: WorkMode.ONSITE, label: 'On-site' },
  ];

  readonly employmentTypeOptions: { value: string; label: string }[] = [
    { value: '', label: '— Select —' },
    { value: EmploymentType.FULL_TIME, label: 'Full-time' },
    { value: EmploymentType.PART_TIME, label: 'Part-time' },
    { value: EmploymentType.CONTRACT, label: 'Contract' },
    { value: EmploymentType.INTERNSHIP, label: 'Internship' },
    { value: EmploymentType.FREELANCE, label: 'Freelance' },
  ];

  readonly jobBoardSourceOptions: { value: string; label: string }[] = [
    { value: '', label: '— Select —' },
    { value: JobBoardSource.LINKEDIN, label: 'LinkedIn' },
    { value: JobBoardSource.INDEED, label: 'Indeed' },
    { value: JobBoardSource.GLASSDOOR, label: 'Glassdoor' },
    { value: JobBoardSource.WELLFOUND, label: 'Wellfound' },
    { value: JobBoardSource.COMPANY_SITE, label: 'Company site' },
    { value: JobBoardSource.REFERRAL, label: 'Referral' },
    { value: JobBoardSource.RECRUITER_OUTREACH, label: 'Recruiter outreach' },
    { value: JobBoardSource.OTHER, label: 'Other' },
  ];

  get jobUrlValue(): string | null {
    return this.group.get('job_url')?.value ?? null;
  }

  get companyNameInvalid(): boolean {
    const ctrl = this.group.get('company_name');
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  get jobPositionInvalid(): boolean {
    const ctrl = this.group.get('job_position');
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  toggleDescription(): void {
    this.descriptionExpanded.update((v) => !v);
  }
}
