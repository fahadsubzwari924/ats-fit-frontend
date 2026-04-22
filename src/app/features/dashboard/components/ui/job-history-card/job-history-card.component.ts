import { DatePipe, NgClass, TitleCasePipe } from '@angular/common';
import { Component, input, output, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
// Models
import { JobApplication } from '@features/apply-new-job/models/job-application.model';
// Enums
import { ApplicationStatus } from '@features/dashboard/enums/application-status.enum';

@Component({
  selector: 'app-job-history-card',
  imports: [DatePipe, TitleCasePipe, NgClass, FormsModule],
  templateUrl: './job-history-card.component.html',
  styleUrl: './job-history-card.component.scss'
})
export class JobHistoryCardComponent implements OnInit {

  // Input property
  public jobHistory = input<JobApplication>();

  // Output property
  public jobStatusChange = output<JobApplication>();

  // Get all application statuses as array
  public applicationStatuses = Object.values(ApplicationStatus);

  // Internal state
  public selectedStatus = signal<string | null>(null);

  ngOnInit() {
    this.selectedStatus.set(this.jobHistory()?.status ?? null);
  }

  public getStatusColor(status: JobApplication['status']): string {
    switch (status) {
      case 'applied':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'screening':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'technical_round':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'interviewed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'offer_received':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  public onStatusChange(): void {
    const job = this.jobHistory();
    if (job && job.id) {
      this.jobStatusChange.emit({ ...job, status: this.selectedStatus() || '' });
    }
  }


}
