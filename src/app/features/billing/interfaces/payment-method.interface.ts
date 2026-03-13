export interface PaymentMethod {
  id: string;
  cardNumber: string; // Masked card number (e.g., •••• •••• •••• 4242)
  expiryDate: string; // MM/YY format
  cardType: 'visa' | 'mastercard' | 'amex' | 'discover' | 'other';
  isDefault: boolean;
  cardHolderName?: string;
  last4Digits: string;
  iconClasses?: string;
  iconGradient?: string;
}

export type CardType = 'visa' | 'mastercard' | 'amex' | 'discover' | 'other';
