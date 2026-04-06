import { Component, computed, input, output } from '@angular/core';

export interface DashboardHeroStat {
  value: string;
  label: string;
}

@Component({
  selector: 'app-dashboard-hero',
  standalone: true,
  templateUrl: './dashboard-hero.component.html',
  styleUrl: './dashboard-hero.component.scss',
})
export class DashboardHeroComponent {
  userName = input<string | null | undefined>(undefined);
  resumeCount = input<number>(0);

  tailorClicked = output<void>();
  quickTailorClicked = output<void>();
  resumeHistoryClicked = output<void>();

  readonly heroStats = computed<DashboardHeroStat[]>(() => [
    { value: String(this.resumeCount() || '0'), label: 'Resumes' },
    { value: '—', label: 'Avg. Score' },
  ]);

  readonly displayName = computed(() => this.userName() || 'User');
}
