import { Component, computed, input, output } from '@angular/core';

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

  readonly displayName = computed(() => this.userName() || 'User');
}
