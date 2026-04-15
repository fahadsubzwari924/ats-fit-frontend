import { Component, input, output } from '@angular/core';
import { PaymentMethod } from '../../interfaces/payment-method.interface';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-payment-method-card',
  imports: [NgClass],
  templateUrl: './payment-method-card.component.html',
  styleUrl: './payment-method-card.component.scss'
})
export class PaymentMethodCardComponent {
  paymentMethod = input<PaymentMethod>({} as PaymentMethod);
  setAsDefault = output<string>();
  deletePaymentMethod = output<string>();

  onSetAsDefault(): void {
    this.setAsDefault.emit(this.paymentMethod().id);
  }

  onDeletePaymentMethod(): void {
    this.deletePaymentMethod.emit(this.paymentMethod().id);
  }

  getCardIconGradient(cardType: string | undefined): string {
    switch ((cardType ?? '').toLowerCase()) {
      case 'visa':
        return 'from-blue-600 to-indigo-600';
      case 'mastercard':
        return 'from-red-500 to-orange-500';
      case 'amex':
        return 'from-green-600 to-teal-600';
      case 'discover':
        return 'from-orange-500 to-yellow-500';
      default:
        return 'from-gray-600 to-slate-600';
    }
  }
}
