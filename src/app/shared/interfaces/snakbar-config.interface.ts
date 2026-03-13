export interface SnackbarConfig {
  duration?: number;
  horizontalPosition?: 'start' | 'center' | 'end' | 'left' | 'right';
  verticalPosition?: 'top' | 'bottom';
  action?: string;
  panelClass?: string | string[];
}
