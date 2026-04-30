import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { BillingNavigationService } from '@shared/services/billing-navigation.service';

@Component({
  selector: 'app-beta-expiry-modal',
  standalone: true,
  imports: [],
  templateUrl: './beta-expiry-modal.component.html',
  styleUrl: './beta-expiry-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BetaExpiryModalComponent {
  @Input() visible = false;
  @Output() closed = new EventEmitter<void>();

  private readonly billingNav = inject(BillingNavigationService);

  onGetFoundingRate(): void {
    this.billingNav.goToPlansSection();
    this.closed.emit();
  }

  onDismiss(): void {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onDismiss();
    }
  }
}
