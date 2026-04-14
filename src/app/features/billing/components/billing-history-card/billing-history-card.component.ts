import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentHistory } from '@features/billing/models/payment-history.model';

@Component({
  selector: 'app-billing-history-card',
  imports: [CommonModule],
  templateUrl: './billing-history-card.component.html',
  styleUrl: './billing-history-card.component.scss'
})
export class BillingHistoryCardComponent {

  item = input<PaymentHistory>({} as PaymentHistory);
  downloadInvoice = output<PaymentHistory>();

  onDownloadClick(): void {
    this.downloadInvoice.emit(this.item());
  }

    /**
   * Get status badge classes based on payment status
   * @param status The payment status
   * @returns CSS classes for the status badge
   */
  public getStatusClasses(status: string | undefined): string {
    switch ((status ?? '').toLowerCase()) {
      case 'success':
        return 'bg-emerald-100 text-emerald-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Get icon classes based on payment status
   * @param status The payment status
   * @returns CSS classes for the icon background
   */
  public getIconClasses(status: string | undefined): string {
    switch ((status ?? '').toLowerCase()) {
      case 'success':
        return 'bg-emerald-100';
      case 'pending':
        return 'bg-yellow-100';
      case 'failed':
        return 'bg-red-100';
      case 'refunded':
        return 'bg-blue-100';
      default:
        return 'bg-gray-100';
    }
  }

  /**
   * Get icon color classes based on payment status
   * @param status The payment status
   * @returns CSS classes for the icon color
   */
  public getIconColor(status: string | undefined): string {
    switch ((status ?? '').toLowerCase()) {
      case 'paid':
        return 'text-emerald-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      case 'refunded':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  }

}
