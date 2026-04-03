import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard-tips-card',
  standalone: true,
  imports: [],
  templateUrl: './dashboard-tips-card.component.html',
  styleUrl: './dashboard-tips-card.component.scss',
})
export class DashboardTipsCardComponent {
  readonly tips: string[] = [
    'Add measurable impact metrics to your bullet points',
    'Include keywords directly from the job description',
    'Keep formatting clean for ATS parsing',
  ];
}
