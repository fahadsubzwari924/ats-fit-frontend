import { Component, inject, OnInit, signal } from '@angular/core';
import { BillingHistoryItem } from '@features/billing/interfaces/billing-history.interface';
import { BillingHistoryCardComponent } from '@features/billing/components/billing-history-card/billing-history-card.component';
import { BillingService } from '@features/billing/services/billing.service';
import { PaymentHistory } from "../../models/payment-history.model";

@Component({
  selector: 'app-history-tab',
  imports: [BillingHistoryCardComponent],
  templateUrl: './history-tab.component.html',
  styleUrl: './history-tab.component.scss'
})
export class HistoryTabComponent implements OnInit {

  // Dependency Injection
  private billingService = inject(BillingService);

  // Internal State
  subscriptionHistory = signal<PaymentHistory[] | null>(null);

  /**
   * Initialize billing history with dynamic status classes
   */
  ngOnInit(): void {
    this.getUserSubscription();
  }


  private getUserSubscription(): void {
    this.billingService.getUserPaymentHistory()
    .subscribe({
      next: (response) => {
        this.subscriptionHistory.set(response);
      },
      error: (error) => {
        console.error('Error fetching user subscription:', error);
      }
    });
  }

  /**
   * Handle download invoice action
   * @param item The billing history item to download
   */
  onDownloadInvoice(item: PaymentHistory): void {
    console.log('Downloading invoice:', item?.id);
    // Implement your download logic here
    // This could call a service to download the PDF invoice
  }


  /**
   * TrackBy function for ngFor to improve performance
   * @param index The index of the item
   * @param item The billing history item
   * @returns Unique identifier for the item
   */
  trackByItemId(index: number, item: BillingHistoryItem): string {
    return item.id;
  }

}
