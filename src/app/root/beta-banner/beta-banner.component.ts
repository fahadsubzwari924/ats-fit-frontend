import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { BetaState } from '@core/states/beta.state';
import { AppRoutes } from '@core/constants/app-routes.contant';

@Component({
  selector: 'app-beta-banner',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './beta-banner.component.html',
  styleUrl: './beta-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BetaBannerComponent {
  private betaState = inject(BetaState);
  private dismissed = signal(false);

  readonly show = computed(() => this.betaState.isActiveBeta() && !this.dismissed());
  readonly daysRemaining = this.betaState.daysRemaining;
  readonly isUrgent = computed(() => (this.daysRemaining() ?? 99) <= 3);

  readonly billingRoute = AppRoutes.BILLING;

  dismiss(): void {
    this.dismissed.set(true);
  }
}
