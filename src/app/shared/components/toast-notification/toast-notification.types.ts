export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface AppToastData {
  message: string;
  variant: ToastVariant;
  /** Shown as a text action; omit or use default dismiss control only */
  actionLabel?: string;
}
