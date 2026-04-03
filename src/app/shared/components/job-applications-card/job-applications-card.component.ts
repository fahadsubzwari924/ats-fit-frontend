import { Component, input, output } from '@angular/core';
import { JobApplication } from '@features/apply-new-job/models/job-application.model';
import { JobHistoryCardComponent } from '@features/dashboard/components/ui/job-history-card/job-history-card.component';

@Component({
  selector: 'app-job-applications-card',
  standalone: true,
  imports: [JobHistoryCardComponent],
  templateUrl: './job-applications-card.component.html',
  styleUrl: './job-applications-card.component.scss',
})
export class JobApplicationsCardComponent {
  applications = input.required<JobApplication[]>();
  jobStatusChange = output<JobApplication>();
}
