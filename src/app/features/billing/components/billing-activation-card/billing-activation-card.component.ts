import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
  ACTIVATION_ARIA_LIVE,
  ACTIVATION_CTA,
  ACTIVATION_HEADLINE,
  ACTIVATION_HELPER,
  ACTIVATION_STATE,
  ACTIVATION_SUBHEAD,
  ActivationState,
  PREMIUM_HIGHLIGHTS,
} from '../../constants/billing-activation.constants';

@Component({
  selector: 'app-billing-activation-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './billing-activation-card.component.html',
})
export class BillingActivationCardComponent {
  readonly state = input.required<ActivationState>();

  readonly continueClick = output<void>();
  readonly refreshClick = output<void>();
  readonly supportClick = output<void>();

  /** Static lists / labels exposed for template binding. */
  readonly highlights = PREMIUM_HIGHLIGHTS;
  readonly cta = ACTIVATION_CTA;

  /** State predicates — keep all magic strings out of the template. */
  readonly isConfirming = computed(() => this.state() === ACTIVATION_STATE.CONFIRMING);
  readonly isProvisioning = computed(() => this.state() === ACTIVATION_STATE.PROVISIONING);
  readonly isSuccess = computed(() => this.state() === ACTIVATION_STATE.SUCCESS);
  readonly isTimeout = computed(() => this.state() === ACTIVATION_STATE.TIMEOUT);
  readonly isPending = computed(() => this.isConfirming() || this.isProvisioning());

  /** Localized-style lookups so the template only renders, never decides copy. */
  readonly headline = computed(() => ACTIVATION_HEADLINE[this.state()]);
  readonly subhead = computed(() => ACTIVATION_SUBHEAD[this.state()]);
  readonly helperText = computed(() => ACTIVATION_HELPER[this.state()]);
  readonly ariaLive = computed(() => ACTIVATION_ARIA_LIVE[this.state()]);
}
