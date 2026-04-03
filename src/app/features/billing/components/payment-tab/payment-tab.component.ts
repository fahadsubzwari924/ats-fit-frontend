import { Component, inject, signal } from '@angular/core';
import { PaymentMethod } from '@features/billing/interfaces/payment-method.interface';
import { ModalService } from '@shared/services/modal.service';
import { AddPaymentMethodModalComponent } from '@features/billing/modal/add-payment-method-modal/add-payment-method-modal.component';
import { UserState } from '@core/states/user.state';
import { BillingPaymentSidebarComponent } from '@features/billing/components/billing-payment-sidebar/billing-payment-sidebar.component';

@Component({
  selector: 'app-payment-tab',
  imports: [BillingPaymentSidebarComponent],
  templateUrl: './payment-tab.component.html',
  styleUrl: './payment-tab.component.scss',
})
export class PaymentTabComponent {
  private modalService = inject(ModalService);
  readonly userState = inject(UserState);

  paymentMethods = signal<PaymentMethod[]>([
    {
      id: '1',
      cardNumber: '•••• •••• •••• 4242',
      expiryDate: '12/25',
      cardType: 'visa',
      isDefault: true,
      cardHolderName: 'John Doe',
      last4Digits: '4242',
      iconGradient: 'from-blue-600 to-indigo-600',
    },
    {
      id: '2',
      cardNumber: '•••• •••• •••• 8888',
      expiryDate: '09/26',
      cardType: 'mastercard',
      isDefault: false,
      cardHolderName: 'John Doe',
      last4Digits: '8888',
      iconGradient: 'from-blue-600 to-indigo-600',
    },
  ]);

  renewalDateLabel(): string {
    const reset = this.userState.currentUser()?.featureUsage?.[0]?.resetDate;
    if (!reset) return '—';
    return new Date(reset).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  defaultCardLast4(): string {
    const d = this.paymentMethods().find(m => m.isDefault);
    return d?.last4Digits ?? '4242';
  }

  onAddNewPaymentMethod(): void {
    this.modalService.openModal(AddPaymentMethodModalComponent);
  }

  onSetAsDefault(id: string): void {
    this.paymentMethods.update(list => list.map(m => ({ ...m, isDefault: m.id === id })));
  }

  onDeletePaymentMethod(id: string): void {
    const list = this.paymentMethods();
    const target = list.find(m => m.id === id);
    if (target?.isDefault) return;
    this.paymentMethods.set(list.filter(m => m.id !== id));
  }

  getCardBrand(cardType: string): string {
    switch (cardType.toLowerCase()) {
      case 'visa':
        return 'Visa';
      case 'mastercard':
        return 'Mastercard';
      case 'amex':
        return 'American Express';
      case 'discover':
        return 'Discover';
      default:
        return 'Card';
    }
  }
}
