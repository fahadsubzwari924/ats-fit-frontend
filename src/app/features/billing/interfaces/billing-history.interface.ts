export interface BillingHistoryItem {
  id: string;
  amount: string;
  status: 'Paid' | 'Pending' | 'Failed' | 'Refunded';
  statusClasses: string;
  description: string;
  date: string;
  invoiceNumber: string;
  iconClasses: string;
  iconColor: string;
}

export type BillingStatus = 'Paid' | 'Pending' | 'Failed' | 'Refunded';
