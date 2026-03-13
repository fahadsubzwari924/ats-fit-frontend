import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentMethod } from '@features/billing/interfaces/payment-method.interface';
import { PaymentMethodCardComponent } from '../payment-method-card/payment-method-card.component';
import { ModalService } from '@shared/services/modal.service';
import { AddPaymentMethodModalComponent } from '@features/billing/modal/add-payment-method-modal/add-payment-method-modal.component';

@Component({
  selector: 'app-payment-tab',
  imports: [CommonModule, PaymentMethodCardComponent],
  templateUrl: './payment-tab.component.html',
  styleUrl: './payment-tab.component.scss'
})
export class PaymentTabComponent {

  // Dependency Injection
  private modalService = inject(ModalService);

  paymentMethods: PaymentMethod[] = [
    {
      id: '1',
      cardNumber: '•••• •••• •••• 4242',
      expiryDate: '12/25',
      cardType: 'visa',
      isDefault: true,
      cardHolderName: 'John Doe',
      last4Digits: '4242',
      iconGradient: 'from-blue-600 to-indigo-600'
    },
    {
      id: '2',
      cardNumber: '•••• •••• •••• 8888',
      expiryDate: '09/26',
      cardType: 'mastercard',
      isDefault: false,
      cardHolderName: 'John Doe',
      last4Digits: '8888',
      iconGradient: 'from-blue-600 to-indigo-600'
    }
  ];

  /**
   * Handle adding a new payment method
   */
  onAddNewPaymentMethod(): void {
    console.log('Add new payment method clicked');
    this.modalService.openModal(AddPaymentMethodModalComponent);
    // Implement your add payment method logic here
    // This could open a modal or navigate to a form
  }

  /**
   * Handle setting a payment method as default
   * @param paymentMethodId The ID of the payment method to set as default
   */
  onSetAsDefault(paymentMethodId: string): void {
    // Update the payment methods array
    this.paymentMethods.forEach(method => {
      method.isDefault = method.id === paymentMethodId;
    });
    console.log('Set as default:', paymentMethodId);
    // Implement your API call to update the default payment method
  }

  /**
   * Handle deleting a payment method
   * @param paymentMethodId The ID of the payment method to delete
   */
  onDeletePaymentMethod(paymentMethodId: string): void {
    console.log('Delete payment method:', paymentMethodId);
    // Implement your delete confirmation logic here
    // This could show a confirmation dialog before deleting

    // For now, just remove from the array (you'd typically call an API)
    // this.paymentMethods = this.paymentMethods.filter(method => method.id !== paymentMethodId);
  }

  /**
   * Get card brand based on card type
   * @param cardType The card type
   * @returns Display name for the card brand
   */
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

  /**
   * Get icon gradient classes for different card types
   * @param cardType The card type
   * @returns CSS gradient classes
   */
  getCardIconGradient(cardType: string): string {
    switch (cardType.toLowerCase()) {
      case 'visa':
        return 'from-blue-600 to-indigo-600';
      case 'mastercard':
        return 'from-red-500 to-orange-500';
      case 'amex':
        return 'from-green-600 to-emerald-600';
      case 'discover':
        return 'from-orange-500 to-yellow-500';
      default:
        return 'from-gray-600 to-slate-600';
    }
  }

  /**
   * TrackBy function for ngFor to improve performance
   * @param index The index of the item
   * @param item The payment method item
   * @returns Unique identifier for the item
   */
  trackByPaymentMethodId(index: number, item: PaymentMethod): string {
    return item.id;
  }

}
