import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { BillingService } from '@features/billing/services/billing.service';
import { PaymentHistory } from '@features/billing/models/payment-history.model';
import { UserState } from '@core/states/user.state';
import { BillingHistorySidebarComponent } from '@features/billing/components/billing-history-sidebar/billing-history-sidebar.component';

@Component({
  selector: 'app-history-tab',
  imports: [DatePipe, BillingHistorySidebarComponent],
  templateUrl: './history-tab.component.html',
  styleUrl: './history-tab.component.scss',
})
export class HistoryTabComponent implements OnInit {
  private billingService = inject(BillingService);
  private userState = inject(UserState);

  subscriptionHistory = signal<PaymentHistory[] | null>(null);

  readonly totalPaidNum = computed(() => {
    const items = this.subscriptionHistory() || [];
    return items.reduce((s, i) => {
      const n = parseFloat(String(i.amount ?? '').replace(/[^0-9.]/g, ''));
      return s + (Number.isFinite(n) ? n : 0);
    }, 0);
  });

  ngOnInit(): void {
    this.billingService.getUserPaymentHistory().subscribe({
      next: response => this.subscriptionHistory.set(response),
      error: err => console.error('Payment history error:', err),
    });
  }

  invoiceDescription(item: PaymentHistory): string {
    return (
      item.subscriptionPlan?.planName ||
      item.paymentGatewayResponse?.data?.attributes?.billingReason ||
      'Subscription'
    );
  }

  invoiceRef(item: PaymentHistory): string {
    return item.id || item.paymentGatewayTransactionId || '—';
  }

  statusPill(item: PaymentHistory): string {
    const s = (item.status || '').toLowerCase();
    if (s === 'success') return 'Paid';
    return item.status || '—';
  }

  isPaidStatus(item: PaymentHistory): boolean {
    return (item.status || '').toLowerCase() === 'success';
  }

  lastPaymentAmount(): string {
    const items = this.subscriptionHistory() || [];
    if (!items.length) return '$0.00';
    const first = items[0];
    return first.amount || '$0.00';
  }

  lastPaymentDate(): string {
    const items = this.subscriptionHistory() || [];
    if (!items.length) return '—';
    return new Date(items[0].createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  renewalDateLabel(): string {
    const reset = this.userState.currentUser()?.featureUsage?.[0]?.resetDate;
    if (!reset) return '—';
    return new Date(reset).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  planAmountLabel(): string {
    const sub = this.subscriptionHistory()?.[0]?.subscriptionPlan;
    const p = sub?.price?.trim();
    const suffix = sub?.billingCycle === 'yearly' ? '/yr' : '/mo';
    if (p) return (p.startsWith('$') ? p : `$${p}`) + suffix;
    return '$19.00/mo';
  }

  planNameLabel(): string {
    const sub = this.subscriptionHistory()?.[0]?.subscriptionPlan;
    if (sub?.planName) return `${sub.planName} ${sub.billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}`.trim();
    if (this.userState.currentUser()?.isPremium) return 'Premium Monthly';
    return 'Free';
  }

  onDownloadInvoice(item: PaymentHistory): void {
    const url = item.paymentGatewayResponse?.data?.attributes?.urls?.invoiceUrl;
    if (url) {
      window.open(url, '_blank', 'noopener');
    }
  }

  hasInvoiceUrl(item: PaymentHistory): boolean {
    const url = item.paymentGatewayResponse?.data?.attributes?.urls?.invoiceUrl;
    return typeof url === 'string' && url.length > 0;
  }
}
